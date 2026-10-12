import { NextRequest, NextResponse } from "next/server";
import { normalizeBatch, normalizeDrug, normalizeManufacturer } from "@/lib/normalize";
import { parseExpiry } from "@/lib/expiry";
import { executeCheckBatch } from "@/lib/supabase-server";

// Simple in-memory per-IP rate limiter (e.g. 60 requests per 60 seconds)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit = 60, windowMs = 60000): boolean {
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

// Clean up stale rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(ip);
      }
    }
  }, 300000);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous-client";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // 2. Parse and Validate Body
    const body = await req.json().catch(() => ({}));
    const { drug_name, manufacturer, batch_number, expiry_raw } = body;

    const trimmedBatch = typeof batch_number === "string" ? batch_number.trim() : "";
    if (!trimmedBatch) {
      return NextResponse.json(
        { error: "Batch number is required. Please enter the batch number from your medicine strip." },
        { status: 400 }
      );
    }

    // 3. Compute Normalized Keys
    const batchKey = normalizeBatch(trimmedBatch);
    const drugKey = normalizeDrug(drug_name || "");
    const mfrKey = normalizeManufacturer(manufacturer || "");

    if (!batchKey) {
      return NextResponse.json(
        { error: "The provided batch number contains no alphanumeric characters. Please check your input." },
        { status: 400 }
      );
    }

    // 4. Parse Expiry
    const expResult = parseExpiry(expiry_raw);

    // 5. Query Supabase check_batch RPC
    const { rows, sources } = await executeCheckBatch(batchKey, drugKey, mfrKey);

    // 6. Apply Decision Rules
    let status: "flagged" | "expired" | "no_match" = "no_match";
    let confidence: "high" | "low" | undefined = undefined;
    let isAlsoExpired = false;

    if (rows.length > 0) {
      status = "flagged";
      const topRow = rows[0];
      const drugSim = topRow.drug_sim ?? 0;
      const mfrSim = topRow.mfr_sim ?? 0;

      // If (drug_sim >= 0.35 OR mfr_sim >= 0.5) -> confidence "high"
      // Else -> confidence "low"
      if (drugSim >= 0.35 || mfrSim >= 0.5) {
        confidence = "high";
      } else {
        confidence = "low";
      }

      if (expResult.parsed && expResult.isExpired) {
        isAlsoExpired = true;
      }
    } else if (expResult.parsed && expResult.isExpired) {
      status = "expired";
      confidence = "high";
    } else {
      status = "no_match";
    }

    // 7. Format Sources & Dates
    const uniqueSourceNames = Array.from(new Set(sources.map((s) => s.name)));
    const listsCheckedNames = uniqueSourceNames.join(", ") || "CDSCO NSQ alert lists";

    // Find latest published month
    let latestMonthYear = "Recent";
    const validMonths = sources
      .map((s) => s.published_month)
      .filter((m): m is string => Boolean(m))
      .sort()
      .reverse();

    if (validMonths.length > 0) {
      try {
        const d = new Date(validMonths[0]);
        if (!isNaN(d.getTime())) {
          latestMonthYear = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        }
      } catch {
        latestMonthYear = validMonths[0];
      }
    }

    return NextResponse.json({
      status,
      confidence,
      isAlsoExpired,
      matchedRows: rows,
      sources,
      listsCheckedNames,
      latestMonthYear,
      normalized: {
        batch_key: batchKey,
        drug_key: drugKey,
        manufacturer_key: mfrKey,
      },
      expiry: expResult,
    });
  } catch (err: any) {
    console.error("API /api/check unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while checking the batch. Please try manual entry." },
      { status: 500 }
    );
  }
}

