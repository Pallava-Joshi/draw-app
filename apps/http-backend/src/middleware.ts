import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

declare module "express" {
    interface Request {
        userId?: string;
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    // Check for Bearer token format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "No valid Bearer token provided" });
        return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded !== "string" && "userId" in decoded) {
            const userId = decoded.userId;
            req.userId = userId;
            next();
        } else {
            res.status(403).json({ message: "Unauthorized" });
        }
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
