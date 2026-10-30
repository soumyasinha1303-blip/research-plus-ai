import { Router } from "express";
import { sendChatMessage, getChatSessions, getSessionMessages } from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody, chatMessageSchema } from "../middleware/validate.js";

const router = Router();

router.use(authMiddleware);

router.post("/message", validateBody(chatMessageSchema), sendChatMessage);
router.get("/sessions", getChatSessions);
router.get("/sessions/:sessionId/messages", getSessionMessages);

export default router;
