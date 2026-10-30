import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query, generateUUID } from "../db/database.js";
import { generateToken, AuthenticatedRequest } from "../middleware/auth.js";

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, fullName } = req.body;

  try {
    const existing = query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rowCount > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const userId = generateUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    query(
      "INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)",
      [userId, email.toLowerCase().trim(), passwordHash, fullName.trim()]
    );

    // Automatically create a default research workspace
    const workspaceId = generateUUID();
    query(
      `INSERT INTO workspaces (id, user_id, name, description, domain) VALUES ($1, $2, $3, $4, $5)`,
      [
        workspaceId,
        userId,
        "Primary Research Workspace",
        "Default workspace for document ingestion, entity discovery, and multi-document synthesis.",
        "Computer Science & AI Research",
      ]
    );

    const user = { id: userId, email: email.toLowerCase().trim(), fullName: fullName.trim() };
    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user,
      defaultWorkspaceId: workspaceId,
    });
  } catch (err: any) {
    console.error("[authController.register] Error:", err);
    res.status(500).json({ error: "Failed to register user", details: err.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    const result = query("SELECT id, email, password_hash, full_name FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);

    if (result.rowCount === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const userRow = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Get user's primary workspace
    const wsResult = query("SELECT id FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [
      userRow.id,
    ]);
    const defaultWorkspaceId = wsResult.rows[0]?.id;

    const user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
    };
    const token = generateToken(user);

    res.json({
      message: "Authentication successful",
      token,
      user,
      defaultWorkspaceId,
    });
  } catch (err: any) {
    console.error("[authController.login] Error:", err);
    res.status(500).json({ error: "Authentication failed", details: err.message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = query("SELECT id, email, full_name, created_at FROM users WHERE id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
}
