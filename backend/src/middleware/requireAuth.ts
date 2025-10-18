import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

interface JwtPayload {
  userId: string;
}

export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "missing authorization header" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "invalid authorization header" });

    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "user not found" });

    // attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "invalid token" });
  }
}