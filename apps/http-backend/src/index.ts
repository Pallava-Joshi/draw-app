import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { createUserSchema, signInSchema, createRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
const app = express();

app.use(express.json());

app.post('/signup', async (req, res) => {
    const parsedData = createUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).send('Invalid username or password');
        return;
    }
    //bcrypt password before storing
    try{
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data?.password,
                name: parsedData.data?.name,
            }
    })
    res.json({ userId: user.id });
    }catch(e){
        res.status(411).send("User already exists - try logging in");
    }  
    
});

app.post('/signin',async (req, res) => {
    const parsedData = signInSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).send('Invalid username or password');
        return;
    }

    const user = await prismaClient.user.findUnique({
        where: {
            email: parsedData.data?.username,
            password: parsedData.data.password
        }
    })

    if(!user){
        res.status(403).send('User not authorisez');
    return; 
}

    //check for username and password in db
    //compare password using bcrypt

    
    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);
    
    res.json({ token });
});

app.post('/room', middleware, async (req, res) => { 
    
    const parsedData = createRoomSchema.safeParse(req.body);
    if(!parsedData.success)
    {
        res.status(400).send('Invalid room inputs');
        return;
    }
    //@ts-ignore
    const userId = req.userId;
    if (!userId) {
        res.status(403).send('user not authenticated');
        return;
    }
    try{
        const room = await prismaClient.room.create({
            data:{
                slug: parsedData.data?.name,
                adminId: userId
            }
        })
        res.json({ roomId: room.id });
    }catch(e){
        res.status(411).send("room already exists - try different name");
    }
})

app.get("/chats/:roomId", async (req, res) => {
    const roomId = Number(req.params.roomId);
    const chats = await prismaClient.chat.findMany({
        where: {
            roomId: roomId
        },
        orderBy: {
            id:"desc"
        },
        take: 50
    })
    res.json(chats);
})
app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findUnique({
        where: {
            slug
        }
    })
    if(!room) {
        res.status(404).send('Room not found');
        return;
    }
    res.json(room);
})

app.listen(3001, () => {
    console.log("Server started on port 3001");
});