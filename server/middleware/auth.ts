import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Sign in required" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user) {
    req.session.userId = undefined;
    return res.status(401).json({ message: "Sign in required" });
  }
  (req as any).user = user;
  next();
}

export function requireRole(...roles: Array<"donor" | "volunteer" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    next();
  };
}
