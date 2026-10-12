import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 30;

// Simple in-memory rate limiting per IP for extract route (e.g. 30 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= limit) {
    return true;
  }
  record.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "client";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit reached. Please wait a minute before trying again or enter details manually.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("GEMINI_API_KEY is not set or placeholder. Falling back to manual entry.");
      return NextResponse.json(
        {
          error: "Gemini API key is not configured. Falling back to manual entry.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        {
          error: "Invalid multipart form data.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    const file = formData.get("image");
    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          error: "No image file provided in 'image' field.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    // Validate size (max 4.5 MB for Vercel serverless body safety)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "Image exceeds 4.5 MB limit. Please resize or take a smaller photo.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Uploaded file is not an image.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    // Process image strictly in-memory (never write to disk or storage)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `You are a precision pharmaceutical OCR specialist.
Your objective is to read printed and embossed text on a medicine strip or pharmaceutical pack.

Inspect the photo carefully and extract the following 4 fields:
1. drug_name: Brand or generic name (e.g., "Altopan 40", "Curocef 100mg", "Paracetamol 500mg").
2. manufacturer: Name of the manufacturer or marketing pharmaceutical company.
3. batch_number: The batch/lot number. Look for indicators such as "B.No.", "Batch", "Batch No.", "Lot", "Lot No.". Extract ONLY the alphanumeric batch string without the label prefix.
4. expiry_raw: The expiration date exactly as printed (e.g., "08/2026", "MAR 2026", "08.26", "10/2025"). Look for labels like "EXP", "EXPIRY", "USE BEFORE".
5. confidence: "high" if batch and drug name are distinct and unambiguous; "medium" if faintly stamped or partially readable; "low" if uncertain or missing.

STRICT ACCURACY RULES:
- Copy characters EXACTLY as printed.
- NEVER guess, invent, or autocomplete missing characters.
- If unsure of any field, or if it is not visible in the image, return null for that field.
- Ignore MRP, manufacturing dates, licenses, barcodes, dosages, and marketing slogans.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType: mimeType === "image/png" ? "image/png" : "image/jpeg",
            data: base64Data,
          },
        },
        promptText,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drug_name: { type: Type.STRING, nullable: true },
            manufacturer: { type: Type.STRING, nullable: true },
            batch_number: { type: Type.STRING, nullable: true },
            expiry_raw: { type: Type.STRING, nullable: true },
            confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
          },
          required: ["confidence"],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return NextResponse.json(
        {
          error: "Empty extraction response from vision model.",
          drug_name: null,
          manufacturer: null,
          batch_number: null,
          expiry_raw: null,
          confidence: "low",
        },
        { status: 200 }
      );
    }

    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      drug_name: parsed.drug_name ?? null,
      manufacturer: parsed.manufacturer ?? null,
      batch_number: parsed.batch_number ?? null,
      expiry_raw: parsed.expiry_raw ?? null,
      confidence: parsed.confidence || "medium",
    });
  } catch (err: any) {
    console.error("POST /api/extract error:", err);
    // Return HTTP 200 with error property so UI gracefully falls back to manual entry screen
    return NextResponse.json(
      {
        error: err.message || "Image extraction failed. Please enter details manually.",
        drug_name: null,
        manufacturer: null,
        batch_number: null,
        expiry_raw: null,
        confidence: "low",
      },
      { status: 200 }
    );
  }
}

