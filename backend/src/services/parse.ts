import fs from "fs";
import sharp from "sharp";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";  // ensure you’re using this SDK (npm i @google/generative-ai)

dotenv.config();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // or gemini-1.5-pro
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function preprocessImageToBase64(imagePath: string) {
  const buf = await sharp(imagePath)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return buf.toString("base64");
}

function buildImagePrompt() {
  return `
You are given a photo of a shopping receipt.
Return a single valid JSON object strictly matching this schema:
{
  "merchant": string|null,
  "date": string|null,
  "currency": string|null,
  "total": number|null,
  "subtotal": number|null,
  "tax": number|null,
  "items": [
    { "description": string, "quantity": number|null, "unit_price": number|null, "total_price": number|null }
  ],
  "confidence": number|null
}

Rules:
- Output ONLY JSON, nothing else.
- Use null for missing fields.
- Normalize numbers (no currency symbols).
- Canonicalize date to YYYY-MM-DD if possible.
- If uncertain, use confidence < 0.6.
  `;
}

export async function parseReceiptImage(imagePath: string) {
  const base64 = await preprocessImageToBase64(imagePath);
  const prompt = buildImagePrompt();

  const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64,
              },
            },
          ],
        },
      ],
    });

    // Extract text output
    const outputText =
      result?.response?.text() ??
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "";

    if (!outputText) throw new Error("Empty response from Gemini");

    const first = outputText.indexOf("{");
    const last = outputText.lastIndexOf("}");
    if (first === -1 || last === -1) throw new Error("No JSON found");
    const jsonText = outputText.slice(first, last + 1);

    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (err: any) {
    console.error("[parseReceiptImage] gemini error:", err);
    throw err;
  }
}