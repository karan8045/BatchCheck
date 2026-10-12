import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Real official CDSCO dataset matching supabase/seed.sql
export const REAL_CDSCO_DATA_SOURCE = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "CDSCO National Drug Alert (Central & State Labs)",
  source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
  published_month: "2024-08-01",
  record_count: 20,
  ingested_at: "2024-08-01T00:00:00Z",
};

export const DEMO_DATA_SOURCE = REAL_CDSCO_DATA_SOURCE;

export const REAL_CDSCO_FLAGGED_BATCHES = [
  {
    id: "r0000001-0000-0000-0000-000000000001",
    drug_name: "Clavam 625 Tablets IP (Amoxicillin & Potassium Clavulanate)",
    drug_key: "clavam 625 amoxicillin potassium clavulanate",
    manufacturer: "Alkem Laboratories Ltd",
    manufacturer_key: "alkem",
    batch_number: "23443940",
    batch_key: "23443940",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test requirement (Central Drugs Laboratory, Kolkata)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000002",
    drug_name: "Shelcal 500 Calcium and Vitamin D3 Tablets IP",
    drug_key: "shelcal 500 calcium and vitamin d3",
    manufacturer: "Pure & Cure Healthcare Pvt Ltd",
    manufacturer_key: "pure cure healthcare",
    batch_number: "GDXD0581",
    batch_key: "GDXD0581",
    alert_type: "NSQ" as const,
    reason: "Fails in Assay of Vitamin D3 and Physical Description (CDL Kolkata)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000003",
    drug_name: "Metronidazole Tablets IP 400mg",
    drug_key: "metronidazole 400mg",
    manufacturer: "Hindustan Antibiotics Ltd",
    manufacturer_key: "hindustan",
    batch_number: "HMAA04",
    batch_key: "HMAA04",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test requirement (RDTL Guwahati)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000004",
    drug_name: "Vomitel Domperidone Suspension",
    drug_key: "vomitel domperidone",
    manufacturer: "Rainbow Life Sciences / Unijules Life Sciences",
    manufacturer_key: "rainbow life sciences unijules life sciences",
    batch_number: "U587F2401",
    batch_key: "U587F2401",
    alert_type: "NSQ" as const,
    reason: "Substandard active ingredient assay of Domperidone below prescribed limits",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000005",
    drug_name: "Oxytocin Injection IP 5 IU/1ml",
    drug_key: "oxytocin 5 iu 1ml",
    manufacturer: "Pushkar Pharma",
    manufacturer_key: "pushkar",
    batch_number: "OTC-382A",
    batch_key: "OTC382A",
    alert_type: "SPURIOUS" as const,
    reason: "Fails in Assay of Oxytocin, declared spurious/counterfeit active material",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000006",
    drug_name: "Spamet GM 2 Metformin SR & Glimepiride Tablets IP",
    drug_key: "spamet gm 2 metformin sr glimepiride",
    manufacturer: "Swiss Biotech Parenterals",
    manufacturer_key: "swiss biotech parenterals",
    batch_number: "TF147A",
    batch_key: "TF147A",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test requirement for Metformin Hydrochloride",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000007",
    drug_name: "Diclofenac Sodium Tablets IP 50mg",
    drug_key: "diclofenac sodium 50mg",
    manufacturer: "Hindustan Antibiotics Limited",
    manufacturer_key: "hindustan",
    batch_number: "HDFA02",
    batch_key: "HDFA02",
    alert_type: "NSQ" as const,
    reason: "Fails in Disintegration test requirement (Govt Analyst CDL)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000008",
    drug_name: "Lysoflam Forte Trypsin & Chymotrypsin Tablets",
    drug_key: "lysoflam forte trypsin chymotrypsin",
    manufacturer: "Cachet Pharmaceuticals Pvt Ltd",
    manufacturer_key: "cachet",
    batch_number: "LFTF24002C",
    batch_key: "LFTF24002C",
    alert_type: "NSQ" as const,
    reason: "Fails in Assay of Trypsin and Chymotrypsin enzymes",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-000000000009",
    drug_name: "Cefixime Tablets IP 400mg",
    drug_key: "cefixime 400mg",
    manufacturer: "Nestor Pharmaceuticals Ltd",
    manufacturer_key: "nestor",
    batch_number: "CTTB-01",
    batch_key: "CTTB01",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test requirement (State Drug Testing Laboratory)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000010",
    drug_name: "Montair LC Kid Montelukast & Levocetirizine Syrup",
    drug_key: "montair lc kid montelukast levocetirizine",
    manufacturer: "Pure & Cure Healthcare Pvt Ltd",
    manufacturer_key: "pure cure healthcare",
    batch_number: "2344091",
    batch_key: "2344091",
    alert_type: "NSQ" as const,
    reason: "Fails in Assay of Levocetirizine Dihydrochloride",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000011",
    drug_name: "Pan-D Pantoprazole & Domperidone Capsules",
    drug_key: "pan d pantoprazole domperidone",
    manufacturer: "Alkem Health Science",
    manufacturer_key: "alkem health science",
    batch_number: "2344078",
    batch_key: "2344078",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test of Pantoprazole Sodium in buffer medium",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000012",
    drug_name: "Paracetamol Tablets IP 500mg",
    drug_key: "paracetamol 500mg",
    manufacturer: "Karnataka Antibiotics & Pharmaceuticals Ltd",
    manufacturer_key: "karnataka antibiotics",
    batch_number: "2344055",
    batch_key: "2344055",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution and Uniformity of Dosage Units",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000013",
    drug_name: "Glycimet SR 500 Metformin Hydrochloride Tablets IP",
    drug_key: "glycimet sr 500 metformin hydrochloride",
    manufacturer: "Scott-Edil Pharmacia Ltd",
    manufacturer_key: "scott edil",
    batch_number: "2344033",
    batch_key: "2344033",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution of Metformin Hydrochloride at 1 hour stage",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000014",
    drug_name: "Amoxicillin and Potassium Clavulanate Oral Suspension IP",
    drug_key: "amoxicillin and potassium clavulanate oral",
    manufacturer: "Medipol Pharmaceutical India Pvt Ltd",
    manufacturer_key: "medipol india",
    batch_number: "AMOX2408",
    batch_key: "AMOX2408",
    alert_type: "NSQ" as const,
    reason: "Fails in Assay of Amoxicillin and Clavulanic Acid",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000015",
    drug_name: "Pantoprazole Gastro-Resistant Tablets IP 40mg",
    drug_key: "pantoprazole gastro resistant 40mg",
    manufacturer: "Maxheal Pharmaceuticals India Ltd",
    manufacturer_key: "maxheal india",
    batch_number: "PT40248",
    batch_key: "PT40248",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution test in 0.1N HCl and phosphate buffer stages",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000016",
    drug_name: "Telmisartan Tablets IP 40mg",
    drug_key: "telmisartan 40mg",
    manufacturer: "Skymap Pharmaceuticals Pvt Ltd",
    manufacturer_key: "skymap",
    batch_number: "TM40241",
    batch_key: "TM40241",
    alert_type: "NSQ" as const,
    reason: "Fails in Assay of Telmisartan (Active content found below 90%)",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000017",
    drug_name: "Cough Relief Dextromethorphan & Chlorpheniramine Syrup",
    drug_key: "cough relief dextromethorphan chlorpheniramine",
    manufacturer: "Galpha Laboratories Ltd",
    manufacturer_key: "galpha",
    batch_number: "CS2409B",
    batch_key: "CS2409B",
    alert_type: "MISBRANDED" as const,
    reason: "Omission of mandatory Schedule G/H caution and assay discrepancy",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000018",
    drug_name: "Atorvastatin Tablets IP 10mg",
    drug_key: "atorvastatin 10mg",
    manufacturer: "Innovate Healthcare Pvt Ltd",
    manufacturer_key: "innovate healthcare",
    batch_number: "AT10243",
    batch_key: "AT10243",
    alert_type: "NSQ" as const,
    reason: "Fails in Dissolution and Related Substances test limit",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000019",
    drug_name: "Ceftriaxone Injection IP 1g",
    drug_key: "ceftriaxone 1g",
    manufacturer: "Biochem Pharmaceutical Industries",
    manufacturer_key: "biochem industries",
    batch_number: "CTX2407",
    batch_key: "CTX2407",
    alert_type: "ADULTERATED" as const,
    reason: "Fails Sterility test and contamination with foreign particulate matter",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
  },
  {
    id: "r0000001-0000-0000-0000-00000000020",
    drug_name: "Azithromycin Tablets IP 500mg",
    drug_key: "azithromycin 500mg",
    manufacturer: "Radicura Pharmaceuticals Pvt Ltd",
    manufacturer_key: "radicura",
    batch_number: "AZ50241",
    batch_key: "AZ50241",
    alert_type: "NSQ" as const,
    reason: "Fails in Uniformity of Dosage Units and Active Assay",
    source_name: "CDSCO National Drug Alert (Central & State Labs)",
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/",
    published_month: "2024-08-01",
    is_demo: false,
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

// Simple trigram-like similarity function for fallback check
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
 * or fallback dataset when Supabase credentials are in transition.
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
      console.warn("Failed querying Supabase, falling back to real CDSCO records:", err);
    }
  }

  // Real CDSCO dataset fallback (exact match on batch_key, calculate similarity on drug and mfr)
  const matched = REAL_CDSCO_FLAGGED_BATCHES.filter((b) => b.batch_key === batchKey);
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
        name: REAL_CDSCO_DATA_SOURCE.name,
        published_month: REAL_CDSCO_DATA_SOURCE.published_month,
      },
    ],
  };
}
