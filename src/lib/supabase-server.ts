import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { normalizeBatch, normalizeDrug, normalizeManufacturer } from "./normalize";

// In-memory demo fallback dataset matching supabase/seed.sql
export const DEMO_DATA_SOURCE = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "DEMO DATA (fictional)",
  source_url: "https://cdsco.gov.in/demo-alerts",
  published_month: "2026-08-01",
  record_count: 8,
  ingested_at: "2026-08-01T00:00:00Z",
};

export const DEMO_FLAGGED_BATCHES = [
  {
    id: "d0000001-0000-0000-0000-000000000001",
    drug_name: "Altopan Pantoprazole Tablets 40mg",
    drug_key: "altopan pantoprazole 40mg",
    manufacturer: "Novagen Healthcare Pvt Ltd",
    manufacturer_key: "novagen healthcare",
    batch_number: "BX2417A",
    batch_key: "BX2417A",
    alert_type: "NSQ" as const,
    reason: "Fails dissolution test requirement",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000002",
    drug_name: "Curocef Cefixime Suspension 100mg/5ml",
    drug_key: "curocef cefixime 100mg 5ml",
    manufacturer: "Zenith Bioceuticals Limited",
    manufacturer_key: "zenith bioceuticals",
    batch_number: "ZN9804B",
    batch_key: "ZN9804B",
    alert_type: "NSQ" as const,
    reason: "Substandard assay of active ingredient",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000003",
    drug_name: "Vitamax B-Complex Syrup with Lysine",
    drug_key: "vitamax b complex with lysine",
    manufacturer: "Aster Remedies Pvt Ltd",
    manufacturer_key: "aster remedies",
    batch_number: "AS5541C",
    batch_key: "AS5541C",
    alert_type: "MISBRANDED" as const,
    reason: "Omission of mandatory warning declarations and inaccurate labeling",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000004",
    drug_name: "Cardiomil Amlodipine Tablets 5mg IP",
    drug_key: "cardiomil amlodipine 5mg",
    manufacturer: "Medisphere Therapeutics Pvt Ltd",
    manufacturer_key: "medisphere therapeutics",
    batch_number: "MS1092D",
    batch_key: "MS1092D",
    alert_type: "SPURIOUS" as const,
    reason: "Does not contain declared active pharmaceutical ingredient",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000005",
    drug_name: "Glucorest Metformin Hydrochloride 500mg Tablets",
    drug_key: "glucorest metformin hydrochloride 500mg",
    manufacturer: "BioNexus Formulations Ltd",
    manufacturer_key: "bionexus formulations",
    batch_number: "BN7732E",
    batch_key: "BN7732E",
    alert_type: "NSQ" as const,
    reason: "Fails uniformity of dosage units test",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000006",
    drug_name: "Respifree Levocetirizine and Montelukast Tablets",
    drug_key: "respifree levocetirizine and montelukast",
    manufacturer: "Horizon Life Sciences Private Limited",
    manufacturer_key: "horizon life sciences",
    batch_number: "HL4310F",
    batch_key: "HL4310F",
    alert_type: "ADULTERATED" as const,
    reason: "Contaminated with foreign particulate matter",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000007",
    drug_name: "Dolozox Paracetamol and Diclofenac Tablets",
    drug_key: "dolozox paracetamol and diclofenac",
    manufacturer: "Starlight Wellness Labs Pvt Ltd",
    manufacturer_key: "starlight wellness",
    batch_number: "SW6205G",
    batch_key: "SW6205G",
    alert_type: "NSQ" as const,
    reason: "Fails disintegration time requirement",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
  {
    id: "d0000001-0000-0000-0000-000000000008",
    drug_name: "Gastrocalm Omeprazole Capsules 20mg BP",
    drug_key: "gastrocalm omeprazole 20mg",
    manufacturer: "Aura BioLabs Limited",
    manufacturer_key: "aura biolabs",
    batch_number: "AB3189H",
    batch_key: "AB3189H",
    alert_type: "OTHER" as const,
    reason: "Packaging seal compromised and discoloration observed",
    source_name: "DEMO DATA (fictional)",
    source_url: "https://cdsco.gov.in/demo-alerts",
    published_month: "2026-08-01",
    is_demo: true,
  },
];

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-project-id") || key.includes("your_supabase_service_role_key")) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}

// Simple trigram-like similarity function for fallback demo check
function calcTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const getTrigrams = (str: string): Set<string> => {
    const s = `  ${str} `;
    const set = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) {
      set.add(s.substring(i, i + 3));
    }
    return set;
  };
  const setA = getTrigrams(a);
  const setB = getTrigrams(b);
  let intersection = 0;
  for (const tri of setA) {
    if (setB.has(tri)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

export interface CheckBatchRow {
  id: string;
  drug_name: string;
  manufacturer: string | null;
  batch_number: string;
  alert_type: "NSQ" | "SPURIOUS" | "ADULTERATED" | "MISBRANDED" | "OTHER";
  reason: string | null;
  source_name: string;
  source_url: string | null;
  published_month: string | null;
  is_demo: boolean;
  drug_sim: number;
  mfr_sim: number;
}

/**
 * Executes batch check query via Supabase check_batch RPC function
 * or fallback in-memory dataset when Supabase credentials are demo/unset.
 */
export async function executeCheckBatch(
  batchKey: string,
  drugKey: string,
  mfrKey: string
): Promise<{ rows: CheckBatchRow[]; sources: { name: string; published_month: string | null }[] }> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      // 1. Call RPC check_batch
      const { data: rows, error: rpcError } = await supabase.rpc("check_batch", {
        p_batch_key: batchKey,
        p_drug_key: drugKey,
        p_mfr_key: mfrKey,
      });

      if (rpcError) {
        console.error("Supabase check_batch RPC error:", rpcError);
        throw rpcError;
      }

      // 2. Fetch all data sources for "Lists checked"
      const { data: sources, error: srcError } = await supabase
        .from("data_sources")
        .select("name, published_month")
        .order("published_month", { ascending: false });

      if (srcError) {
        console.error("Supabase data_sources fetch error:", srcError);
      }

      return {
        rows: (rows || []) as CheckBatchRow[],
        sources: (sources || []) as { name: string; published_month: string | null }[],
      };
    } catch (err) {
      console.warn("Failed querying Supabase, falling back to built-in demo records:", err);
    }
  }

  // Built-in in-memory fallback (exact match on batch_key, calculate similarity on drug and mfr)
  const matched = DEMO_FLAGGED_BATCHES.filter((b) => b.batch_key === batchKey);
  const rows: CheckBatchRow[] = matched.map((b) => {
    const drugSim = calcTrigramSimilarity(b.drug_key, drugKey);
    const mfrSim = calcTrigramSimilarity(b.manufacturer_key, mfrKey);
    return {
      id: b.id,
      drug_name: b.drug_name,
      manufacturer: b.manufacturer,
      batch_number: b.batch_number,
      alert_type: b.alert_type,
      reason: b.reason,
      source_name: b.source_name,
      source_url: b.source_url,
      published_month: b.published_month,
      is_demo: b.is_demo,
      drug_sim: drugSim,
      mfr_sim: mfrSim,
    };
  }).sort((a, b) => b.drug_sim - a.drug_sim);

  return {
    rows,
    sources: [
      {
        name: DEMO_DATA_SOURCE.name,
        published_month: DEMO_DATA_SOURCE.published_month,
      },
    ],
  };
}

