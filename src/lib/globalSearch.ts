import { supabase } from "./supabaseClient";

export interface SearchResult {
  type: "receipt" | "stand" | "ratepayer" | "record";
  label: string;
  sublabel: string;
  goTab: string;
  goSub?: string;
}

// Searches across whatever the logged-in role's RLS actually allows them to
// see - a collector searching will naturally only ever get their own scoped
// receipts back, with no special-casing needed here.
export async function runGlobalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [{ data: receipts }, { data: stands }, { data: ratepayers }, { data: records }] = await Promise.all([
    supabase.from("receipts").select("id, receipt_number, fee_type, amount").ilike("receipt_number", `%${q}%`).limit(4),
    supabase.from("land_stands").select("id, stand_number, buyer_name").or(`stand_number.ilike.%${q}%,buyer_name.ilike.%${q}%`).limit(4),
    supabase.from("ratepayers").select("id, name, type").ilike("name", `%${q}%`).limit(4),
    supabase.from("digitized_records").select("id, title, category").ilike("title", `%${q}%`).limit(4),
  ]);

  const results: SearchResult[] = [];
  (receipts ?? []).forEach((r) =>
    results.push({ type: "receipt", label: r.receipt_number, sublabel: `${r.fee_type} · $${r.amount}`, goTab: "revenue", goSub: "collection" })
  );
  (stands ?? []).forEach((s) =>
    results.push({ type: "stand", label: s.buyer_name, sublabel: s.stand_number, goTab: "revenue", goSub: "stands" })
  );
  (ratepayers ?? []).forEach((r) =>
    results.push({ type: "ratepayer", label: r.name, sublabel: r.type, goTab: "revenue", goSub: "ratepayers" })
  );
  (records ?? []).forEach((r) =>
    results.push({ type: "record", label: r.title, sublabel: r.category, goTab: "records" })
  );

  return results;
}
