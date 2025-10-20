// backend/src/routes/receipts.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../prisma";
import requireAuth from "../middleware/requireAuth";
import { recognizeImage } from "../services/ocr";
import { parseReceiptImage } from "../services/parse";

const router = Router();

// Setup uploads directory
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
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

/**
 * POST /api/receipts
 * Upload a new receipt image → OCR → Parse (Gemini)
 */
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.file) return res.status(400).json({ error: "file required (field name: file)" });

    const imageUrl = `/uploads/${req.file.filename}`;
    const fullPath = path.join(uploadDir, req.file.filename);

    // 1️⃣ Create receipt entry
    const receipt = await prisma.receipt.create({
      data: { userId: user.id, imageUrl },
    });

    // 2️⃣ Run OCR (Tesseract)
    let ocrText = "";
    try {
      const ocrResult = await recognizeImage(fullPath);
      ocrText = ocrResult?.text ?? "";
      await prisma.receipt.update({ where: { id: receipt.id }, data: { ocrText } });
      console.log(`[receipts] OCR complete for ${receipt.id}`);
    } catch (ocrErr) {
      console.error("[receipts] OCR failed:", ocrErr);
    }

    // 3️⃣ Parse directly from image using Gemini
    let parsed: any = null;
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("[receipts] GEMINI_API_KEY not set — skipping parse");
      } else {
        parsed = await parseReceiptImage(fullPath);
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { parsed },
        });
        console.log(`[receipts] Parsed and saved for ${receipt.id}`);
      }
    } catch (err) {
      console.error("[receipts] parseReceiptImage failed:", err);
    }

    // 4️⃣ Return latest row
    const updated = await prisma.receipt.findUnique({ where: { id: receipt.id } });
    return res.json({ receipt: updated, parsed });
  } catch (err) {
    console.error("receipt upload error", err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/receipts/:id
 * Fetch a receipt by ID
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id;
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) return res.status(404).json({ error: "not found" });
    if (receipt.userId !== user.id) return res.status(403).json({ error: "forbidden" });
    return res.json({ receipt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /api/receipts/:id/parse
 * Retry parsing a receipt (Gemini image parsing)
 */
router.post("/:id/parse", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id;

    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) return res.status(404).json({ error: "receipt not found" });
    if (receipt.userId !== user.id) return res.status(403).json({ error: "forbidden" });

    const imagePath = path.join(process.cwd(), receipt.imageUrl.replace("/uploads/", "uploads/"));
    if (!fs.existsSync(imagePath)) return res.status(404).json({ error: "receipt image not found" });

    let parsed: any;
    try {
      parsed = await parseReceiptImage(imagePath);
    } catch (err: any) {
      console.error("[receipts:parse] gemini parse error", err);
      return res.status(500).json({ error: err?.message || "Gemini parse failed" });
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: { parsed },
    });

    return res.json({ receipt: updated, parsed });
  } catch (err: any) {
    console.error("parse error:", err);
    return res.status(500).json({ error: err?.message || "parse failed" });
  }
});

/**
 * PATCH /api/receipts/:id
 * Save edited parsed JSON from frontend
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id;
    const { parsed } = req.body;

    if (!parsed) return res.status(400).json({ error: "parsed object required in body" });

    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) return res.status(404).json({ error: "not found" });
    if (receipt.userId !== user.id) return res.status(403).json({ error: "forbidden" });

    const updated = await prisma.receipt.update({
      where: { id },
      data: { parsed },
    });

    console.log(`[receipts] updated parsed data for ${id}`);
    return res.json({ receipt: updated });
  } catch (err) {
    console.error("[receipts] PATCH failed:", err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;