import React, { useEffect, useState } from "react";
import { Camera, FolderOpen, FileText, Check, Search } from "lucide-react";
import { Card, SectionHeader, IconChip } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account, StatusTone } from "../lib/types";

interface CategoryRow {
  id: string;
  name: string;
  ward: string;
  total_estimated: number;
}
interface RecordRow {
  id: string;
  title: string;
  category: string;
  ward: string;
  captured_by: string;
  created_at: string;
}

function progressTone(pct: number): StatusTone {
  return pct >= 90 ? "success" : pct >= 50 ? "warn" : "danger";
}
function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

export function RecordsScreen({ account, showCaptureAction = true }: { account: Account; showCaptureAction?: boolean }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecordRow[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [capturing, setCapturing] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [ward, setWard] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justCaptured, setJustCaptured] = useState(false);

  async function load() {
    const [{ data: categoryData }, { data: recordData }, { data: allRecords }] = await Promise.all([
      supabase.from("digitization_categories").select("id, name, ward, total_estimated"),
      supabase.from("digitized_records").select("id, title, category, ward, captured_by, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("digitized_records").select("category, ward"),
    ]);
    setCategories(categoryData ?? []);
    setRecords(recordData ?? []);
    const counts: Record<string, number> = {};
    (allRecords ?? []).forEach((r) => {
      const key = `${r.category}|${r.ward}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    setCategoryCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Live search across title/category/ward - simple and fast; the schema
  // also has full-text + fuzzy search infrastructure (search_text, pg_trgm)
  // ready for a more advanced version of this later if needed.
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      supabase
        .from("digitized_records")
        .select("id, title, category, ward, captured_by, created_at")
        .or(`title.ilike.%${query}%,category.ilike.%${query}%,ward.ilike.%${query}%,captured_by.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setSearchResults(data ?? []);
          setSearching(false);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function submitCapture() {
    setSubmitting(true);
    setSubmitError("");
    const { error } = await supabase.from("digitized_records").insert({
      title,
      category: category || "Uncategorized",
      ward: ward || account.ward || "Unspecified",
      captured_by: account.name,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Couldn't save this record. Check your connection and try again.");
      return;
    }
    setJustCaptured(true);
    setCapturing(false);
    setTitle("");
    setCategory("");
    setWard("");
    await load();
  }

  if (loading) return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading...</div>;

  const totalDigitized = categories.reduce((s, c) => s + (categoryCounts[`${c.name}|${c.ward}`] ?? 0), 0);
  const totalAll = categories.reduce((s, c) => s + c.total_estimated, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDigitized / totalAll) * 100) : 0;

  const displayedRecords = searchResults ?? records;

  return (
    <div className="px-3.5 pt-4 pb-6">
      {categories.length > 0 && (
        <Card className="p-6 mb-4.5 bg-gradient-to-br from-chrome to-chromeAlt border-0">
          <div className="text-[11.5px] text-chromeFaint mb-2 tracking-wide">ARCHIVE DIGITIZED</div>
          <div className="font-display text-[32px] font-semibold text-white mb-2.5">{overallPct}%</div>
          <div className="h-[7px] bg-white/15 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-accent rounded-full" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="text-[11.5px] text-chromeFaint">
            {totalDigitized.toLocaleString()} of {totalAll.toLocaleString()} records digitized
          </div>
        </Card>
      )}

      {showCaptureAction && !capturing && (
        <button
          onClick={() => { setCapturing(true); setJustCaptured(false); }}
          className={`w-full py-3.5 rounded-lg text-sm font-semibold mb-5 flex items-center justify-center gap-1.5 ${
            justCaptured ? "bg-successSoft text-success" : "bg-accent text-white"
          }`}
        >
          {justCaptured ? <Check size={16} /> : <Camera size={16} />}
          {justCaptured ? "Record captured — digitize another" : "Digitize a record"}
        </button>
      )}

      {capturing && (
        <Card className="p-4 mb-5">
          <div className="text-sm font-semibold text-ink mb-3">New record</div>
          <label className="text-xs font-semibold text-ink mb-1.5 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stand 214 allocation letter"
            className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-3"
          />
          <label className="text-xs font-semibold text-ink mb-1.5 block">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Land title records"
            list="category-suggestions"
            className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-3"
          />
          <datalist id="category-suggestions">
            {categories.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
          <label className="text-xs font-semibold text-ink mb-1.5 block">Ward</label>
          <input
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder={account.ward || "e.g. Ward 7"}
            className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4"
          />
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => setCapturing(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">
              Cancel
            </button>
            <button
              onClick={submitCapture}
              disabled={!title || submitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save record"}
            </button>
          </div>
        </Card>
      )}

      <div className="relative mb-4.5">
        <Search size={15} className="text-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search records by title, category, ward, or who captured it"
          className="w-full py-2.5 pl-9 pr-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
        />
      </div>

      {categories.length > 0 && !query && (
        <>
          <SectionHeader title="By category" />
          {categories.map((c) => {
            const digitized = categoryCounts[`${c.name}|${c.ward}`] ?? 0;
            const pct = c.total_estimated > 0 ? Math.round((digitized / c.total_estimated) * 100) : 0;
            const backlog = Math.max(0, c.total_estimated - digitized);
            const tone = progressTone(pct);
            return (
              <Card key={c.id} tone={tone} className="p-3.5 mb-2">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <IconChip icon={FolderOpen} tone={tone} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{c.name}</div>
                    <div className="text-[11px] text-dim">{c.ward} · {backlog} remaining</div>
                  </div>
                  <div className="font-display text-base font-semibold text-ink">{pct}%</div>
                </div>
                <div className="h-[5px] bg-[#E4EAED] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: tone === "success" ? "#1F8A6F" : tone === "warn" ? "#C08A2E" : "#B33F3F" }}
                  />
                </div>
              </Card>
            );
          })}
        </>
      )}

      <div className="mt-4.5">
        <SectionHeader title={query ? `Search results${searching ? "..." : ""}` : "Recently captured"} />
        <Card className="overflow-hidden">
          {displayedRecords.length === 0 && (
            <div className="px-3.5 py-4 text-xs text-dim text-center">{query ? "No matching records." : "Nothing digitized yet."}</div>
          )}
          {displayedRecords.map((d, i, arr) => (
            <div key={d.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
              <IconChip icon={FileText} tone="accent" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{d.title}</div>
                <div className="text-[11px] text-dim">{d.category} · {d.ward} · {d.captured_by}</div>
              </div>
              <div className="text-[10.5px] text-faint flex-shrink-0">{timeAgo(d.created_at)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
