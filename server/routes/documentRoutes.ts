import { Router } from "express";
import multer from "multer";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  triggerProcess,
  deleteDocument,
} from "../controllers/documentController.js";
import { authMiddleware } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "text/markdown",
      "application/vnd.ms-excel",
    ];
    const allowedExts = [".pdf", ".csv", ".txt", ".md"];
    const ext = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a PDF, CSV, TXT, or Markdown document."));
    }
  },
});

const router = Router();

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/:id/process", triggerProcess);
router.delete("/:id", deleteDocument);

export default router;
