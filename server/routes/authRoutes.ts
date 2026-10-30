import { Router } from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { validateBody, registerSchema, loginSchema } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", authMiddleware, getMe);

export default router;
