import { Router } from "express";
import { getKnowledgeGraph } from "../controllers/graphController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getKnowledgeGraph);

export default router;
