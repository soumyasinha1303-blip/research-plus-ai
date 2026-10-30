import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
  description: z.string().optional(),
  domain: z.enum([
    "Biomedical & Clinical Life Sciences",
    "Computer Science & AI Research",
    "Economics & Quantitative Finance",
    "Legal, Policy & Compliance",
    "General Interdisciplinary Academic"
  ]).optional().default("Computer Science & AI Research"),
});

export const synthesisRequestSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  documentIds: z.array(z.string()).min(1, "Select at least 1 document").max(5, "Maximum 5 documents per synthesis job"),
  reportType: z.enum(["LITERATURE_REVIEW", "COMPARATIVE_MATRIX", "GAP_ANALYSIS"]),
  formatOptions: z.object({
    depth: z.enum(["CONCISE", "STANDARD", "EXHAUSTIVE"]).optional().default("STANDARD"),
    citationStyle: z.enum(["APA7", "IEEE", "HARVARD", "BIBTEX"]).optional().default("APA7"),
    targetAudience: z.enum(["Executive", "Peer Reviewer", "Layman", "Policy Maker"]).optional().default("Peer Reviewer"),
    tone: z.enum(["Academic", "Analytical", "Critical", "Prescriptive"]).optional().default("Analytical"),
  }).optional(),
});

export const chatMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  documentIds: z.array(z.string()).optional(),
});

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        res.status(400).json({
          error: "Validation failed",
          details: issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      res.status(400).json({ error: "Invalid request payload" });
    }
  };
}
