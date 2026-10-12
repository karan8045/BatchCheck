import { NextResponse } from "next/server";
import { getSupabaseAdmin, DEMO_DATA_SOURCE } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("data_sources")
        .select("id, name, source_url, published_month, record_count, ingested_at")
        .order("published_month", { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ sources: data });
      }
    }

    // Fallback to demo source
    return NextResponse.json({
      sources: [DEMO_DATA_SOURCE],
    });
  } catch (err: any) {
    console.error("GET /api/sources error:", err);
    return NextResponse.json({
      sources: [DEMO_DATA_SOURCE],
    });
  }
}

