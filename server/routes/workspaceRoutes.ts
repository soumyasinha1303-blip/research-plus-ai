import { Router } from "express";
import { getWorkspaces, createWorkspace, getDashboardStats } from "../controllers/workspaceController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody, createWorkspaceSchema } from "../middleware/validate.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getWorkspaces);
router.post("/", validateBody(createWorkspaceSchema), createWorkspace);
router.get("/dashboard-stats", getDashboardStats);

export default router;
