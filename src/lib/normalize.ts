/**
 * Normalization utilities for BatchCheck
 * Identical rules used across TypeScript and Python ingestion script
 */

/**
 * Normalizes batch number:
 * - Uppercase
 * - Remove every character that is not A-Z or 0-9
 * - Fold O -> 0 and I -> 1
 */
export function normalizeBatch(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.toUpperCase();
  // Remove every character that is not A-Z or 0-9
  s = s.replace(/[^A-Z0-9]/g, "");
  // Fold O -> 0
  s = s.replace(/O/g, "0");
  // Fold I -> 1
  s = s.replace(/I/g, "1");
  return s;
}

/**
 * Normalizes drug name:
 * - Lowercase
 * - Replace punctuation with spaces
 * - Remove words: tablet(s), capsule(s), injection, syrup, suspension, ip, bp, usp
 * - Collapse whitespace
 */
export function normalizeDrug(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.toLowerCase();
  // Replace punctuation/symbols with spaces
  s = s.replace(/[^a-z0-9]/g, " ");
  // Remove stop words as whole words
  const stopWordsRegex = /\b(tablets?|capsules?|injection|syrup|suspension|ip|bp|usp)\b/g;
  s = s.replace(stopWordsRegex, " ");
  // Collapse whitespace and trim
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Normalizes manufacturer name:
 * - Lowercase
 * - Replace punctuation with spaces
 * - Remove words: pvt, ltd, limited, private, pharma, pharmaceuticals, laboratories, labs
 * - Collapse whitespace
 */
export function normalizeManufacturer(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.toLowerCase();
  // Replace punctuation/symbols with spaces
  s = s.replace(/[^a-z0-9]/g, " ");
  // Remove stop words as whole words
  const stopWordsRegex = /\b(pvt|ltd|limited|private|pharma|pharmaceuticals|laboratories|labs)\b/g;
  s = s.replace(stopWordsRegex, " ");
  // Collapse whitespace and trim
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

