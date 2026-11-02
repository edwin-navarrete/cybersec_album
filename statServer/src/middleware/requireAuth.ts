import { NextFunction, Request, Response } from "express";
import { AuthConfig, verifyToken } from "../models/auth";

export function requireAuth(cfg: AuthConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
    const user = verifyToken(cfg, token);
    if (!user) return res.status(401).json({ errorMessage: "No autorizado" });
    res.locals.user = user;
    next();
  };
}
