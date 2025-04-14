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

app.use(cors());
app.use(express.json());

// Signup route
app.post("/signup", (req: Request, res: Response) => {
  const parsedData = createUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).send("Invalid username or password");
    return;
  }

  (async () => {
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
  })();
});

// Signin route
app.post("/signin", (req: Request, res: Response) => {
  const parsedData = signInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).send("Invalid username or password");
    return;
  }

  (async () => {
    try {
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

      const token = jwt.sign({ userId: user?.id }, JWT_SECRET);
      res.json({ token });
    } catch (e) {
      res.status(500).send("Internal server error");
    }
  })();
});

// Create room route (protected)
app.post("/room", middleware, (req: Request, res: Response) => {
  const parsedData = createRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).send("Invalid room inputs");
    return;
  }

  const userId = req.userId;
  if (!userId) {
    res.status(403).send("User not authenticated");
    return;
  }

  (async () => {
    try {
      const room = await prismaClient.room.create({
        data: {
          slug: parsedData.data?.name,
          adminId: userId,
        },
      });
      res.json({ roomId: room.id });
    } catch (e) {
      res.status(411).send("Room already exists - try different name");
    }
  })();
});

// Get chats for a room
app.get("/chats/:roomId", (req: Request, res: Response) => {
  const roomId = Number(req.params.roomId);

  (async () => {
    try {
      const chats = await prismaClient.chat.findMany({
        where: { roomId },
        orderBy: { id: "desc" },
        take: 100, // Increased limit to 100
      });
      res.json(chats);
    } catch (e) {
      res.status(500).send("Failed to fetch chats");
    }
  })();
});

// Get shape movements for a room
app.get("/shapeMovements/:roomId", (req: Request, res: Response) => {
  const roomId = Number(req.params.roomId);

  (async () => {
    try {
      const movements = await prismaClient.shapeMovement.findMany({
        where: { roomId },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ movements });
    } catch (e) {
      res.status(500).send("Failed to fetch shape movements");
    }
  })();
});

// Get room by slug
app.get("/room/:slug", (req: Request, res: Response) => {
  const slug = req.params.slug;

  (async () => {
    try {
      const room = await prismaClient.room.findUnique({
        where: { slug },
      });
      if (!room) {
        res.status(404).send("Room not found");
        return;
      }
      res.json(room);
    } catch (e) {
      res.status(500).send("Failed to fetch room");
    }
  })();
});

// Get all rooms (protected)
app.get("/rooms", middleware, (req: Request, res: Response) => {
  prismaClient.room
    .findMany({
      include: {
        admin: {
          select: { name: true },
        },
      },
    })
    .then((rooms) => res.json(rooms))
    .catch((e) => res.status(500).send("Failed to fetch rooms"));
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server started on port ${process.env.PORT || 3001}`);
});
