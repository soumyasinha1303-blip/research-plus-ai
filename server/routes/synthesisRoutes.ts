import { Router } from "express";
import {
  generateSynthesis,
  getSynthesisReports,
  getSynthesisReportById,
} from "../controllers/synthesisController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody, synthesisRequestSchema } from "../middleware/validate.js";

const router = Router();

router.use(authMiddleware);

router.post("/generate", validateBody(synthesisRequestSchema), generateSynthesis);
router.get("/reports", getSynthesisReports);
router.get("/reports/:id", getSynthesisReportById);

export default router;
