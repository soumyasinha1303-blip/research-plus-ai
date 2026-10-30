import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "omni_research_secure_jwt_secret_dev_2025_academic_engine";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
      message: "Missing or invalid authorization token",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: "Invalid token",
      message: err.message || "Token expired or malformed",
    });
  }
}
