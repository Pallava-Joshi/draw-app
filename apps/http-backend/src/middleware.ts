import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";
    const decoded = jwt.verify(token, JWT_SECRET);


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
