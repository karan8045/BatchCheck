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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
        },
        { status: 200 }
      );
    }

    // Process image strictly in-memory (never write to disk or storage)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `You are a worldwide pharmaceutical expert and precision vision OCR system with exhaustive knowledge of global pharmacopeias (Indian Pharmacopoeia IP, British Pharmacopoeia BP, United States Pharmacopeia USP, European Pharmacopoeia, WHO Essential Medicines List, and global branded formulations).

Inspect the photograph of the medicine container (strip, syrup bottle, suspension, blister pack, vial, ointment, or box).

Extract the following OCR details with maximum precision:
1. drug_name: Brand name or official generic formulation name (e.g., "Altopan 40", "Ascoril-D Plus Syrup", "Augmentin 625 Duo", "Curocef 100mg/5ml Suspension", "Benadryl Cough Formula").
2. manufacturer: Name of the pharmaceutical company, laboratory, or marketing entity.
3. batch_number: The specific batch/lot number printed or embossed. Look for indicators such as "B.No.", "Batch", "Batch No.", "Lot", "Lot No.". Extract ONLY the alphanumeric batch string without the label prefix.
4. expiry_raw: The expiration date exactly as printed (e.g., "08/2026", "MAR 2026", "08.26", "10/2025"). Look for labels like "EXP", "EXPIRY", "USE BEFORE".
5. confidence: "high" if batch and drug name are distinct and unambiguous; "medium" if faintly stamped or partially readable; "low" if uncertain or missing.

WORLDWIDE PHARMACEUTICAL IDENTIFICATION:
Using your comprehensive global pharmacology knowledge base, examine the medicine and identify:
6. active_ingredients: The chemical salt(s), active generic composition, and strengths (e.g., "Dextromethorphan Hydrobromide 10mg + Chlorpheniramine Maleate 2mg + Phenylephrine HCl 5mg per 5ml", "Paracetamol IP 500mg", "Pantoprazole Sodium 40mg").
7. drug_category: Broad therapeutic class (e.g., "Cough & Cold Expectorant / Antihistamine Syrup", "Antipyretic / Analgesic", "Proton Pump Inhibitor (Antacid)", "Antibacterial / Penicillin-class Antibiotic").
8. packaging_type: Form factor detected: "Syrup Bottle / Liquid Suspension", "Blister Strip / Foil Pack", "Vial / Injection", "Dry Syrup / Reconstitutable Oral Suspension", "Topical Tube / Ointment", or "Tablet Box".
9. usage_summary: Objective standard 1-sentence medical reference describing what this generic formulation is indicated for (e.g., "Relieves dry cough, allergic rhinitis, and nasal congestion" or "Reduces fever and provides relief for mild-to-moderate pain").

STRICT ACCURACY RULES:
- Copy batch numbers and dates EXACTLY as printed.
- NEVER guess, invent, or complete missing characters in the batch number.
- If unsure of the batch number, set it to null so the user can verify.
- Return null for any field that cannot be identified.`;

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
            active_ingredients: { type: Type.STRING, nullable: true },
            drug_category: { type: Type.STRING, nullable: true },
            packaging_type: { type: Type.STRING, nullable: true },
            usage_summary: { type: Type.STRING, nullable: true },
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
          active_ingredients: null,
          drug_category: null,
          packaging_type: null,
          usage_summary: null,
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
      active_ingredients: parsed.active_ingredients ?? null,
      drug_category: parsed.drug_category ?? null,
      packaging_type: parsed.packaging_type ?? null,
      usage_summary: parsed.usage_summary ?? null,
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
        active_ingredients: null,
        drug_category: null,
        packaging_type: null,
        usage_summary: null,
      },
      { status: 200 }
    );
  }
}
