import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { createUserSchema, signInSchema, createRoomSchema } from "@repo/common/types";

const app = express();

app.use(express.json());

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username and password are required');
    }

    const data = createUserSchema.safeParse({ username, password });
    if (!data.success) {
        res.status(400).send('Invalid username or password');
    }

    //check for username didnt exist in db
    //add user to db
    //bcrypt password

    res.json({ message: 'User Signed up' });
});

app.post('/signin', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username and password are required');
    }

    const data = signInSchema.safeParse({ username, password });
    if (!data.success) {
        res.status(400).send('Invalid username or password');
    }
    //check for username and password in db
    //compare password using bcrypt

    const userId = 1;
    const token = jwt.sign({userId}, JWT_SECRET);
    
    res.json({ token });
});

app.post('/room', middleware, (req, res) => {    
    const { roomId } = req.body;
    if (!roomId) {
        res.status(400).send('Room ID is required');
    }
    //create room
    //connect to ws
    //send response

    res.json({ roomId: '123' });
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
});