import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req.session as Record<string, unknown>).userId as number | undefined;
    const userRole = (req.session as Record<string, unknown>).userRole as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(userRole ?? "")) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction): void {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const userRole = (req.session as Record<string, unknown>).userRole as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const adminRoles = ["super_admin", "admission_admin", "verification_officer", "finance_verifier"];
  if (!adminRoles.includes(userRole ?? "")) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}
