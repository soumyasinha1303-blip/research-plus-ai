import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { initDatabase } from "./server/db/database.js";
import authRoutes from "./server/routes/authRoutes.js";
import workspaceRoutes from "./server/routes/workspaceRoutes.js";
import documentRoutes from "./server/routes/documentRoutes.js";
import synthesisRoutes from "./server/routes/synthesisRoutes.js";
import chatRoutes from "./server/routes/chatRoutes.js";
import graphRoutes from "./server/routes/graphRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Initialize SQLite/PostgreSQL Database
initDatabase();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/synthesis", synthesisRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/knowledge-graph", graphRoutes);

// System Status Endpoint
app.get("/api/system/status", (_req, res) => {
  res.json({
    name: "OmniResearch AI",
    status: "healthy",
    engine: "Google Gemini 3.8 Flash",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite dev middleware
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
    console.log("[OmniResearch AI] Mounted Vite development middleware");
  } else {
    // Production mode: Serve built static frontend
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`[OmniResearch AI] Serving static files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OmniResearch AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
