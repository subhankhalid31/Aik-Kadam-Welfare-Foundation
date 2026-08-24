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
  // A ban applied mid-session shouldn't wait for the session to expire on
  // its own — kill it here so the very next authenticated request a banned
  // user makes gets cut off, not just their next login attempt.
  if (user.isBanned) {
    req.session.destroy(() => {});
    return res.status(403).json({ message: "This account has been suspended by the platform. If you believe this is a mistake, please contact us." });
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
