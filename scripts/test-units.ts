import { normalizeBatch, normalizeDrug, normalizeManufacturer } from "../src/lib/normalize";
import { parseExpiry } from "../src/lib/expiry";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log("=== Testing normalize.ts ===");

// 1. Batch Key tests: uppercase, alphanumeric only, O->0, I->1
assert(normalizeBatch("BX2417A") === "BX2417A", "normalizeBatch keeps standard batch");
assert(normalizeBatch("bx-2417a") === "BX2417A", "normalizeBatch uppercases and strips dashes");
assert(normalizeBatch("KL-9021-O") === "KL90210", "normalizeBatch folds O to 0 and strips punctuation");
assert(normalizeBatch("I-8812-O") === "188120", "normalizeBatch folds I to 1 and O to 0");
assert(normalizeBatch("b_x/2026") === "BX2026", "normalizeBatch strips slashes and underscores");
assert(normalizeBatch("") === "", "normalizeBatch handles empty string");
assert(normalizeBatch(null) === "", "normalizeBatch handles null");

// 2. Drug Key tests: lowercase, replace punctuation with spaces, remove tablet(s), capsule(s), injection, syrup, suspension, ip, bp, usp, collapse whitespace
assert(
  normalizeDrug("Paracetamol Tablets IP 500mg") === "paracetamol 500mg",
  "normalizeDrug removes tablets and ip"
);
assert(
  normalizeDrug("Amoxicillin Capsules BP 250mg") === "amoxicillin 250mg",
  "normalizeDrug removes capsules and bp"
);
assert(
  normalizeDrug("Cough Relief Syrup USP 100ml") === "cough relief 100ml",
  "normalizeDrug removes syrup and usp"
);
assert(
  normalizeDrug("Curocef Cefixime Suspension 100mg/5ml") === "curocef cefixime 100mg 5ml",
  "normalizeDrug removes suspension and handles slashes"
);
assert(
  normalizeDrug("Ceftriaxone Injection 1g") === "ceftriaxone 1g",
  "normalizeDrug removes injection"
);
assert(
  normalizeDrug("Altopan Pantoprazole Tablet 40mg") === "altopan pantoprazole 40mg",
  "normalizeDrug removes singular tablet"
);

// 3. Manufacturer Key tests: lowercase, remove punctuation, remove pvt, ltd, limited, private, pharma, pharmaceuticals, laboratories, labs, collapse whitespace
assert(
  normalizeManufacturer("Novagen Healthcare Pvt Ltd") === "novagen healthcare",
  "normalizeManufacturer removes pvt and ltd"
);
assert(
  normalizeManufacturer("Zenith Bioceuticals Limited") === "zenith bioceuticals",
  "normalizeManufacturer removes limited"
);
assert(
  normalizeManufacturer("Horizon Life Sciences Private Limited") === "horizon life sciences",
  "normalizeManufacturer removes private and limited"
);
assert(
  normalizeManufacturer("Starlight Wellness Labs Pvt. Ltd.") === "starlight wellness",
  "normalizeManufacturer removes labs, pvt, ltd and punctuation"
);
assert(
  normalizeManufacturer("Apex Pharma Pharmaceuticals & Laboratories") === "apex",
  "normalizeManufacturer removes pharma, pharmaceuticals, laboratories"
);

console.log("\n=== Testing expiry.ts ===");

// Reference date for testing: October 12, 2026
const refDate = new Date("2026-10-12T12:00:00Z");

// Expired tests: last day of month before refDate
const exp1 = parseExpiry("09/2026", refDate);
assert(exp1.parsed === true && exp1.isExpired === true, "09/2026 is expired as of Oct 2026");
assert(exp1.formattedExpiry === "09/2026", "09/2026 formats to 09/2026");

const exp2 = parseExpiry("AUG 2026", refDate);
assert(exp2.parsed === true && exp2.isExpired === true, "AUG 2026 is expired as of Oct 2026");

const exp3 = parseExpiry("08/26", refDate);
assert(exp3.parsed === true && exp3.isExpired === true, "08/26 is expired as of Oct 2026");

// Not expired tests: last day of Oct 2026 is Oct 31, 2026 which is AFTER Oct 12, 2026
const curMonth = parseExpiry("10/2026", refDate);
assert(curMonth.parsed === true && curMonth.isExpired === false, "10/2026 is NOT expired on Oct 12 2026 (valid till Oct 31)");

const future1 = parseExpiry("MAR 2027", refDate);
assert(future1.parsed === true && future1.isExpired === false, "MAR 2027 is NOT expired");

const future2 = parseExpiry("EXP: 12-2028", refDate);
assert(future2.parsed === true && future2.isExpired === false, "EXP: 12-2028 parses and is NOT expired");

const dotFormat = parseExpiry("03.2027", refDate);
assert(dotFormat.parsed === true && dotFormat.isExpired === false, "03.2027 parses correctly");

// Unparseable tests
const unparseable = parseExpiry("UNKNOWN_DATE", refDate);
assert(unparseable.parsed === false && unparseable.isExpired === false, "Unparseable does not mark expired");
assert(unparseable.formattedExpiry === "Expiry not read", "Unparseable shows 'Expiry not read'");

const empty = parseExpiry("", refDate);
assert(empty.parsed === false && empty.isExpired === false, "Empty string handled safely");

console.log("\n🎉 ALL UNIT TESTS PASSED!");
