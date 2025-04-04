import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
    createUserSchema,
    signInSchema,
    createRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();

// Configure CORS to allow requests from the frontend
app.use(
    cors({
        origin: "https://draw-app-fe.onrender.com", // Allow only the frontend origin
        methods: ["GET", "POST"], // Allow specific methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
        credentials: true, // Allow credentials (if needed, e.g., for cookies)
    })
);

app.use(express.json());

// Rest of the routes...
app.post("/signup", async (req, res) => {
    const parsedData = createUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).send("Invalid username or password");
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data?.password,
                name: parsedData.data?.name,
            },
        });
        res.json({ userId: user.id });
    } catch (e) {
        res.status(411).send("User already exists - try logging in");
    }
});

app.post("/signin", async (req, res) => {
    const parsedData = signInSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).send("Invalid username or password");
        return;
    }

    const user = await prismaClient.user.findUnique({
        where: {
            email: parsedData.data?.username,
            password: parsedData.data.password,
        },
    });

    if (!user) {
        res.status(403).send("User not authorisez");
        return;
    }

    const token = jwt.sign(
        {
            userId: user?.id,
        },
        JWT_SECRET
    );

    res.json({ token });
});

// ... other routes ...

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server started on port ${process.env.PORT || 3001}`);
});
