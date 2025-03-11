import {z} from "zod";

export const createUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    name: z.string().min(3).max(20)
});

export const signInSchema = z.object({
    username: z.string(),
    password: z.string()
});

export const createRoomSchema = z.object({
    name: z.string().min(3).max(20)
})