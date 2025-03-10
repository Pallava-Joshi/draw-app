import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    const decoded = jwt.verify(token, secret);


    if (typeof decoded !== 'string' && 'userId' in decoded) {
        const userId = decoded.userId;
        req.userId = userId;
        next();
    } else {
        res.status(403).json({
            message: "Unauthorized"
        });
    }
}
