// src/routes/receipts.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../prisma";
import requireAuth from "../middleware/requireAuth";

const router = Router();

// Multer storage config - store files in backend/uploads with unique filename
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// POST /api/receipts - upload single file (protected)
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.file) return res.status(400).json({ error: "file required (field name: file)" });

    // create a public-accessible URL for dev (serve static later)
    const imageUrl = `/uploads/${req.file.filename}`;

    // Save minimal receipt entry
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imageUrl,
        // ocrText / parsed will be filled later by OCR worker
      },
    });

    return res.json({ receipt });
  } catch (err) {
    console.error("receipt upload error", err);
    return res.status(500).json({ error: "server error" });
  }
});

// GET /api/receipts/:id - get receipt by id (protected)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id;
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) return res.status(404).json({ error: "not found" });
    // simple access check (owner or later group members)
    if (receipt.userId !== user.id) return res.status(403).json({ error: "forbidden" });
    return res.json({ receipt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;