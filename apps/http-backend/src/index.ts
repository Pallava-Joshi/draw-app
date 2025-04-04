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

// Log incoming requests for debugging
app.use((req, res, next) => {
    console.log(
        `Received ${req.method} request for ${req.url} from origin ${req.headers.origin}`
    );
    next();
});

// Configure CORS to allow requests from the frontend
app.use(
    cors({
        origin: "https://draw-app-fe.onrender.com",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// Handle preflight OPTIONS requests for /signin
app.options("/signin", (req, res) => {
    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://draw-app-fe.onrender.com"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.sendStatus(204);
});

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
        res.status(403).send("User not authorized");
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
