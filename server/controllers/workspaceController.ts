import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { query, generateUUID } from "../db/database.js";

export async function getWorkspaces(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const workspaces = query(
      `
      SELECT 
        w.id, w.name, w.description, w.domain, w.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.workspace_id = w.id) as document_count,
        (SELECT COUNT(*) FROM synthesis_reports s WHERE s.workspace_id = w.id) as synthesis_count
      FROM workspaces w
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
      [userId]
    );

    res.json({ workspaces: workspaces.rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
}

export async function createWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, description, domain } = req.body;

  try {
    const wsId = generateUUID();
    query(
      `INSERT INTO workspaces (id, user_id, name, description, domain) VALUES ($1, $2, $3, $4, $5)`,
      [wsId, userId, name.trim(), description || "", domain || "Computer Science & AI Research"]
    );

    res.status(201).json({
      message: "Workspace created successfully",
      workspace: {
        id: wsId,
        name,
        description,
        domain,
        document_count: 0,
        synthesis_count: 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create workspace" });
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const docsCount = query("SELECT COUNT(*) as count FROM documents WHERE user_id = $1", [userId]).rows[0]?.count || 0;
    const completedDocs = query("SELECT COUNT(*) as count FROM documents WHERE user_id = $1 AND status = 'COMPLETED'", [userId]).rows[0]?.count || 0;
    const synthesisCount = query("SELECT COUNT(*) as count FROM synthesis_reports WHERE user_id = $1", [userId]).rows[0]?.count || 0;
    const chatSessionsCount = query("SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = $1", [userId]).rows[0]?.count || 0;

    const recentDocs = query(
      `SELECT id, title, file_name, file_type, file_size_bytes, summary, status, created_at
       FROM documents 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    ).rows;

    const recentSyntheses = query(
      `SELECT id, title, report_type, document_ids, created_at
       FROM synthesis_reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 3`,
      [userId]
    ).rows;

    res.json({
      metrics: {
        totalDocuments: Number(docsCount),
        completedDocuments: Number(completedDocs),
        totalSyntheses: Number(synthesisCount),
        totalChatSessions: Number(chatSessionsCount),
      },
      recentDocs,
      recentSyntheses,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}
