/**
 * Expiry parsing utilities for BatchCheck
 * Accepts: MM/YYYY, MM/YY, MM-YYYY, MM-YY, "MAR 2026", "MARCH 2026", "03.2026", etc.
 * Rule: A medicine is expired if the LAST day of that month is before today.
 * If unparseable, treat expiry as unknown (do not mark expired, show "Expiry not read").
 */

export interface ExpiryResult {
  parsed: boolean;
  isExpired: boolean;
  formattedExpiry: string;
  year?: number;
  month?: number; // 1-12
  lastDayOfMonth?: string; // YYYY-MM-DD
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

export function parseExpiry(raw: string | null | undefined, referenceDate: Date = new Date()): ExpiryResult {
  if (!raw || typeof raw !== "string") {
    return {
      parsed: false,
      isExpired: false,
      formattedExpiry: "Expiry not read",
    };
  }

  // Clean raw string, strip prefixes like EXP, EXP., EXPIRY, EXP DATE, etc.
  let cleaned = raw
    .toUpperCase()
    .replace(/\b(EXP|EXPIRY|EXP\.?|EXP DATE|MFG|MFG DATE|USE BEFORE|VALID UPTO)\b/gi, "")
    .replace(/[:]/g, " ")
    .trim();

  let month: number | null = null;
  let year: number | null = null;

  // Try Pattern 1: Month Name + Year (e.g. "MAR 2026", "MARCH 2026", "MAR-2026", "MAR/26")
  const namedMatch = cleaned.match(/([A-Z]{3,9})[\s\-\/\.]+(\d{2,4})/i);
  if (namedMatch) {
    const monthKey = namedMatch[1].toLowerCase();
    const yearStr = namedMatch[2];
    if (MONTH_NAMES[monthKey]) {
      month = MONTH_NAMES[monthKey];
      const parsedYear = parseInt(yearStr, 10);
      year = parsedYear < 100 ? (parsedYear < 70 ? 2000 + parsedYear : 1900 + parsedYear) : parsedYear;
    }
  }

  // Try Pattern 2: Year + Month Name (e.g. "2026 MAR")
  if (!month || !year) {
    const yearNamedMatch = cleaned.match(/(\d{4})[\s\-\/\.]+([A-Z]{3,9})/i);
    if (yearNamedMatch) {
      const yearStr = yearNamedMatch[1];
      const monthKey = yearNamedMatch[2].toLowerCase();
      if (MONTH_NAMES[monthKey]) {
        month = MONTH_NAMES[monthKey];
        year = parseInt(yearStr, 10);
      }
    }
  }

  // Try Pattern 3: MM/YYYY, MM/YY, MM-YYYY, MM-YY, MM.YYYY, MM.YY (e.g. "08/2026", "08/26", "8/26", "03.2026")
  if (!month || !year) {
    const numMatch = cleaned.match(/(\d{1,2})[\s\-\/\.]+(\d{2,4})/);
    if (numMatch) {
      const m = parseInt(numMatch[1], 10);
      const y = parseInt(numMatch[2], 10);
      if (m >= 1 && m <= 12) {
        month = m;
        year = y < 100 ? (y < 70 ? 2000 + y : 1900 + y) : y;
      }
    }
  }

  // Try Pattern 4: YYYY/MM, YYYY-MM (e.g. "2026-08", "2026/08")
  if (!month || !year) {
    const yFirstMatch = cleaned.match(/(\d{4})[\s\-\/\.]+(\d{1,2})/);
    if (yFirstMatch) {
      const y = parseInt(yFirstMatch[1], 10);
      const m = parseInt(yFirstMatch[2], 10);
      if (m >= 1 && m <= 12) {
        year = y;
        month = m;
      }
    }
  }

  if (!month || !year) {
    return {
      parsed: false,
      isExpired: false,
      formattedExpiry: "Expiry not read",
    };
  }

  // Find the LAST day of that month
  // new Date(year, month, 0) gives the last day of 'month' because month is 1-indexed here
  const lastDayDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  
  // Format MM/YYYY
  const mm = String(month).padStart(2, "0");
  const formattedExpiry = `${mm}/${year}`;
  const lastDayIso = lastDayDate.toISOString().split("T")[0];

  // Compare with referenceDate (today)
  // Medicine is expired if the LAST day of that month is before referenceDate
  const isExpired = lastDayDate.getTime() < referenceDate.getTime();

  return {
    parsed: true,
    isExpired,
    formattedExpiry,
    year,
    month,
    lastDayOfMonth: lastDayIso,
  };
}

