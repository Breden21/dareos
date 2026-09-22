import React, { useEffect, useState } from "react";
import { Camera, FolderOpen, FileText, Check, Search, Plus, Landmark, Users, X } from "lucide-react";
import { Card, Badge, SectionHeader, IconChip, statusTone } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import { compressImage, uploadEvidencePhoto } from "../lib/photoUpload";
import type { Account, StatusTone } from "../lib/types";

// ============================================================
// Digitized records (EFM) - unchanged from before, just extracted
// into its own component so it can sit alongside Stands/Ratepayers.
// ============================================================

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
  updated_by: string | null;
  updated_at: string | null;
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

function DigitizedTab({ account, showCaptureAction }: { account: Account; showCaptureAction: boolean }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecordRow[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [capturing, setCapturing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [ward, setWard] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justCaptured, setJustCaptured] = useState(false);
  const [editorNames, setEditorNames] = useState<Record<string, string>>({});

  async function loadEditorNames() {
    const { data } = await supabase.from("profiles").select("id, name");
    const map: Record<string, string> = {};
    (data ?? []).forEach((p) => { map[p.id] = p.name; });
    setEditorNames(map);
  }

  async function load() {
    const [{ data: categoryData }, { data: recordData }, { data: allRecords }] = await Promise.all([
      supabase.from("digitization_categories").select("id, name, ward, total_estimated"),
      supabase.from("digitized_records").select("id, title, category, ward, captured_by, created_at, updated_by, updated_at").order("created_at", { ascending: false }).limit(10),
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
    await loadEditorNames();
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      supabase
        .from("digitized_records")
        .select("id, title, category, ward, captured_by, created_at, updated_by, updated_at")
        .or(`title.ilike.%${query}%,category.ilike.%${query}%,ward.ilike.%${query}%,captured_by.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setSearchResults(data ?? []);
          setSearching(false);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  function startEdit(d: RecordRow) {
    setEditingId(d.id);
    setCapturing(false);
    setTitle(d.title);
    setCategory(d.category);
    setWard(d.ward);
  }

  async function submitCapture() {
    setSubmitting(true);
    setSubmitError("");

    if (editingId) {
      // Metadata-only correction - deliberately not touching the photo here,
      // to keep this a small, proportionate fix rather than a full re-capture.
      const { error } = await supabase
        .from("digitized_records")
        .update({
          title,
          category: category || "Uncategorized",
          ward: ward || account.ward || "Unspecified",
          updated_by: account.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);
      setSubmitting(false);
      if (error) {
        setSubmitError("Couldn't save these changes. Try again.");
        return;
      }
      setEditingId(null);
      setTitle("");
      setCategory("");
      setWard("");
      await load();
      return;
    }

    let photo_url: string | null = null;
    if (photoFile) {
      const compressed = await compressImage(photoFile);
      photo_url = await uploadEvidencePhoto(account.id, compressed);
    }

    const { error } = await supabase.from("digitized_records").insert({
      title,
      category: category || "Uncategorized",
      ward: ward || account.ward || "Unspecified",
      captured_by: account.name,
      photo_url,
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
    removePhoto();
    await load();
  }

  if (loading) return <div className="pt-8 text-sm text-dim text-center">Loading...</div>;

  const totalDigitized = categories.reduce((s, c) => s + (categoryCounts[`${c.name}|${c.ward}`] ?? 0), 0);
  const totalAll = categories.reduce((s, c) => s + c.total_estimated, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDigitized / totalAll) * 100) : 0;
  const displayedRecords = searchResults ?? records;

  return (
    <div>
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

      {showCaptureAction && !capturing && !editingId && (
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

      {(capturing || editingId) && (
        <Card className="p-4 mb-5">
          <div className="text-sm font-semibold text-ink mb-3">{editingId ? "Edit record" : "New record"}</div>
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
            className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-3"
          />

          <label className="text-xs font-semibold text-ink mb-1.5 block">Evidence photo (optional)</label>
          {editingId ? (
            <div className="text-[11px] text-dim mb-4">Photo not editable here — remove this record and re-digitize if the photo itself needs replacing.</div>
          ) : photoPreviewUrl ? (
            <div className="relative mb-4">
              <img src={photoPreviewUrl} alt="" className="w-full h-40 object-cover rounded-lg border border-border" />
              <button onClick={removePhoto} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="w-full py-6 rounded-lg border-2 border-dashed border-border bg-bg flex flex-col items-center gap-1.5 mb-4 cursor-pointer">
              <Camera size={20} className="text-faint" />
              <span className="text-[11px] text-dim">Tap to take or choose a photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelected} className="hidden" />
            </label>
          )}

          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setCapturing(false); setEditingId(null); setTitle(""); setCategory(""); setWard(""); removePhoto(); }} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">
              Cancel
            </button>
            <button
              onClick={submitCapture}
              disabled={!title || submitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Save changes" : "Save record"}
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
                {d.updated_at && (
                  <div className="text-[10.5px] text-warn mt-0.5">
                    Edited by {editorNames[d.updated_by ?? ""] ?? "someone"} · {new Date(d.updated_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-[10.5px] text-faint">{timeAgo(d.created_at)}</div>
                {showCaptureAction && (
                  <button onClick={() => startEdit(d)} className="text-[10.5px] text-accent font-semibold underline">
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Stands tab - Records Clerk now owns this data entry
// ============================================================

interface StandRow {
  id: string;
  stand_number: string;
  ward: string;
  stand_type: string;
  buyer_name: string;
  price: number;
  amount_paid: number;
  status: string;
  date_allocated: string;
  updated_by: string | null;
  updated_at: string | null;
}
const STAND_TYPES = ["Residential", "Commercial", "Market stall"];
const STAND_STATUSES = ["Unpaid", "Instalments", "Paid up"];

function StandsTab({ account }: { account: Account }) {
  const [stands, setStands] = useState<StandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [standNumber, setStandNumber] = useState("");
  const [ward, setWard] = useState("");
  const [standType, setStandType] = useState(STAND_TYPES[0]);
  const [buyerName, setBuyerName] = useState("");
  const [price, setPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [status, setStatus] = useState(STAND_STATUSES[0]);
  const [dateAllocated, setDateAllocated] = useState(new Date().toISOString().slice(0, 10));
  const [editorNames, setEditorNames] = useState<Record<string, string>>({});

  async function load() {
    const [{ data }, { data: profileData }] = await Promise.all([
      supabase
        .from("land_stands")
        .select("id, stand_number, ward, stand_type, buyer_name, price, amount_paid, status, date_allocated, updated_by, updated_at")
        .order("date_allocated", { ascending: false }),
      supabase.from("profiles").select("id, name"),
    ]);
    setStands(data ?? []);
    const map: Record<string, string> = {};
    (profileData ?? []).forEach((p) => { map[p.id] = p.name; });
    setEditorNames(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setStandNumber(""); setWard(""); setStandType(STAND_TYPES[0]); setBuyerName(""); setPrice(""); setAmountPaid("");
    setStatus(STAND_STATUSES[0]); setDateAllocated(new Date().toISOString().slice(0, 10));
  }

  function startEdit(s: StandRow) {
    setEditingId(s.id);
    setAdding(false);
    setStandNumber(s.stand_number);
    setWard(s.ward);
    setStandType(s.stand_type);
    setBuyerName(s.buyer_name);
    setPrice(String(s.price));
    setAmountPaid(String(s.amount_paid));
    setStatus(s.status);
    setDateAllocated(s.date_allocated.slice(0, 10));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    const payload = {
      stand_number: standNumber,
      ward,
      stand_type: standType,
      buyer_name: buyerName,
      price: Number(price) || 0,
      amount_paid: Number(amountPaid) || 0,
      status,
      date_allocated: dateAllocated,
    };

    const { error } = editingId
      ? await supabase.from("land_stands").update({ ...payload, updated_by: account.id, updated_at: new Date().toISOString() }).eq("id", editingId)
      : await supabase.from("land_stands").insert(payload);

    setSubmitting(false);
    if (error) {
      setSubmitError(`Couldn't save this stand. Check the details and try again.`);
      return;
    }
    resetForm();
    setAdding(false);
    setEditingId(null);
    await load();
  }

  if (loading) return <div className="pt-8 text-sm text-dim text-center">Loading...</div>;

  return (
    <div>
      {!adding && !editingId && (
        <button onClick={() => setAdding(true)} className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5">
          <Plus size={14} /> Add a stand
        </button>
      )}
      {(adding || editingId) && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-semibold text-ink mb-3">{editingId ? "Edit land stand" : "New land stand"}</div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={standNumber} onChange={(e) => setStandNumber(e.target.value)} placeholder="Stand number" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
          <select value={standType} onChange={(e) => setStandType(e.target.value)} className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5">
            {STAND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Price ($)" inputMode="decimal" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <input value={amountPaid} onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Amount paid ($)" inputMode="decimal" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent">
              {STAND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={dateAllocated} onChange={(e) => setDateAllocated(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setEditingId(null); resetForm(); }} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
            <button onClick={submit} disabled={!standNumber || !ward || !buyerName || !price || submitting} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50">
              {submitting ? "Saving..." : editingId ? "Save changes" : "Save stand"}
            </button>
          </div>
        </Card>
      )}
      {stands.length === 0 && <div className="text-sm text-dim text-center pt-4 px-6">No land stand records yet.</div>}
      {stands.map((s) => {
        const pct = Math.round((Number(s.amount_paid) / Number(s.price)) * 100);
        return (
          <Card key={s.id} tone={statusTone(s.status)} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <div className="text-sm font-medium text-ink">{s.buyer_name}</div>
                <div className="text-[11px] text-dim">{s.stand_number} · {s.ward} · allocated {new Date(s.date_allocated).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</div>
                {s.updated_at && (
                  <div className="text-[10.5px] text-warn mt-0.5">
                    Edited by {editorNames[s.updated_by ?? ""] ?? "someone"} · {new Date(s.updated_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                  </div>
                )}
              </div>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </div>
            <div className="flex justify-between text-[11.5px] mb-1.5">
              <span className="text-dim">${s.amount_paid} of ${s.price}</span>
              <span className="text-ink font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden mb-2.5">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }} />
            </div>
            <button onClick={() => startEdit(s)} className="text-[11px] text-accent font-semibold underline">Edit</button>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================
// Ratepayers tab - Records Clerk now owns this data entry
// ============================================================

interface RatepayerRow {
  id: string;
  name: string;
  ward: string;
  type: string;
  balance: number;
  status: string;
  last_payment: string | null;
  updated_by: string | null;
  updated_at: string | null;
}
const RATEPAYER_STATUSES = ["Current", "Arrears"];

function RatepayersTab({ account }: { account: Account }) {
  const [ratepayers, setRatepayers] = useState<RatepayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [name, setName] = useState("");
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState(RATEPAYER_STATUSES[0]);
  const [lastPayment, setLastPayment] = useState("");
  const [editorNames, setEditorNames] = useState<Record<string, string>>({});

  async function load() {
    const [{ data }, { data: profileData }] = await Promise.all([
      supabase.from("ratepayers").select("id, name, ward, type, balance, status, last_payment, updated_by, updated_at").order("name"),
      supabase.from("profiles").select("id, name"),
    ]);
    setRatepayers(data ?? []);
    const map: Record<string, string> = {};
    (profileData ?? []).forEach((p) => { map[p.id] = p.name; });
    setEditorNames(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setName(""); setWard(""); setType(""); setBalance(""); setStatus(RATEPAYER_STATUSES[0]); setLastPayment("");
  }

  function startEdit(r: RatepayerRow) {
    setEditingId(r.id);
    setAdding(false);
    setName(r.name);
    setWard(r.ward);
    setType(r.type);
    setBalance(String(r.balance));
    setStatus(r.status);
    setLastPayment(r.last_payment ? r.last_payment.slice(0, 10) : "");
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    const payload = { name, ward, type, balance: Number(balance) || 0, status, last_payment: lastPayment || null };

    const { error } = editingId
      ? await supabase.from("ratepayers").update({ ...payload, updated_by: account.id, updated_at: new Date().toISOString() }).eq("id", editingId)
      : await supabase.from("ratepayers").insert(payload);

    setSubmitting(false);
    if (error) {
      setSubmitError("Couldn't save this account. Check the details and try again.");
      return;
    }
    resetForm();
    setAdding(false);
    setEditingId(null);
    await load();
  }

  if (loading) return <div className="pt-8 text-sm text-dim text-center">Loading...</div>;

  return (
    <div>
      {!adding && !editingId && (
        <button onClick={() => setAdding(true)} className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5">
          <Plus size={14} /> Add a ratepayer account
        </button>
      )}
      {(adding || editingId) && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-semibold text-ink mb-3">{editingId ? "Edit ratepayer account" : "New ratepayer account"}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name / business name" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Business licence)" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Outstanding balance ($)" inputMode="decimal" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent">
              {RATEPAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="text-[11px] font-semibold text-ink mb-1 block">Last payment date (optional)</label>
          <input type="date" value={lastPayment} onChange={(e) => setLastPayment(e.target.value)} className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4" />
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setEditingId(null); resetForm(); }} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
            <button onClick={submit} disabled={!name || !ward || !type || submitting} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50">
              {submitting ? "Saving..." : editingId ? "Save changes" : "Save account"}
            </button>
          </div>
        </Card>
      )}
      {ratepayers.length === 0 && <div className="text-sm text-dim text-center pt-4 px-6">No ratepayer accounts yet.</div>}
      {ratepayers.map((r) => (
        <Card key={r.id} tone={r.status === "Arrears" ? "danger" : "success"} className="p-3.5 mb-2">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <div className="text-sm font-medium text-ink">{r.name}</div>
            <Badge tone={statusTone(r.status)}>{r.status}</Badge>
          </div>
          <div className="flex justify-between text-[11px] text-dim mb-1">
            <span>{r.type} · {r.ward}</span>
            {r.balance > 0 ? <span className="text-danger font-semibold">${r.balance} due</span> : <span>{r.last_payment ? `Paid ${new Date(r.last_payment).toLocaleDateString([], { day: "numeric", month: "short" })}` : "No payments yet"}</span>}
          </div>
          {r.updated_at && (
            <div className="text-[10.5px] text-warn mb-2">
              Edited by {editorNames[r.updated_by ?? ""] ?? "someone"} · {new Date(r.updated_at).toLocaleDateString([], { day: "numeric", month: "short" })}
            </div>
          )}
          <button onClick={() => startEdit(r)} className="text-[11px] text-accent font-semibold underline">Edit</button>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// Top-level screen - tab strip only shown for the Records Clerk's own
// workstation (showCaptureAction=true). CEO's view (showCaptureAction=false)
// stays exactly as before: digitized records only, no capture, no tabs -
// they assess Stands/Ratepayers from the Revenue tab instead.
// ============================================================

export function RecordsScreen({ account, showCaptureAction = true }: { account: Account; showCaptureAction?: boolean }) {
  const [tab, setTab] = useState<"digitized" | "stands" | "ratepayers">("digitized");

  if (!showCaptureAction) {
    return (
      <div className="px-3.5 pt-4 pb-6">
        <DigitizedTab account={account} showCaptureAction={false} />
      </div>
    );
  }

  return (
    <div className="px-3.5 pt-4 pb-6">
      <div className="flex gap-1.5 mb-4">
        {([
          { key: "digitized", label: "Digitized", icon: FileText },
          { key: "stands", label: "Stands", icon: Landmark },
          { key: "ratepayers", label: "Ratepayers", icon: Users },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-1 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 ${
              tab === t.key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "digitized" && <DigitizedTab account={account} showCaptureAction />}
      {tab === "stands" && <StandsTab account={account} />}
      {tab === "ratepayers" && <RatepayersTab account={account} />}
    </div>
  );
}
