import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, Badge, statusTone } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";

interface AssetRow {
  id: string;
  name: string;
  asset_type: string;
  ward: string;
  condition: string;
}
interface RequestRow {
  id: string;
  category: string;
  ward: string;
  channel: string;
  description: string;
  status: string;
  raised_by: string;
  created_at: string;
}

const CONDITIONS = ["Working", "Needs repair", "Poor"];

export function WardScreen() {
  const [sub, setSub] = useState<"assets" | "requests">("assets");
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [ward, setWard] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[0]);

  async function load() {
    const [{ data: assetData }, { data: requestData }] = await Promise.all([
      supabase.from("assets").select("id, name, asset_type, ward, condition").eq("category", "infrastructure"),
      supabase.from("service_requests").select("id, category, ward, channel, description, status, raised_by, created_at").order("created_at", { ascending: false }),
    ]);
    setAssets(assetData ?? []);
    setRequests(requestData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    const { error } = await supabase.from("assets").insert({
      name,
      asset_type: assetType,
      ward,
      condition,
      category: "infrastructure",
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Couldn't save this asset. Check the details and try again.");
      return;
    }
    setName("");
    setAssetType("");
    setWard("");
    setCondition(CONDITIONS[0]);
    setAdding(false);
    await load();
  }

  if (loading) return <div className="px-3.5 lg:px-8 pt-8 text-sm text-dim text-center">Loading...</div>;

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[900px]">
      <div className="flex gap-1.5 mb-4">
        {(["assets", "requests"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-1 lg:flex-none lg:px-6 py-2.5 px-2 rounded-lg text-xs font-semibold border ${
              sub === key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            {key === "assets" ? "Infrastructure" : "Service requests"}
          </button>
        ))}
      </div>

      {sub === "assets" && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add an infrastructure asset
        </button>
      )}

      {sub === "assets" && adding && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-semibold text-ink mb-3">New infrastructure asset</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Dazi Borehole 3)" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="Type (e.g. Borehole, Road)" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4">
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
            <button
              onClick={submit}
              disabled={!name || !assetType || !ward || submitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save asset"}
            </button>
          </div>
        </Card>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        {sub === "assets" && assets.length === 0 && <div className="text-xs text-dim text-center py-6 col-span-2">No infrastructure assets recorded yet.</div>}
        {sub === "assets" &&
          assets.map((a) => (
            <Card key={a.id} tone={statusTone(a.condition)} className="p-3.5 mb-2 lg:mb-0">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="text-sm font-medium text-ink">{a.name}</div>
                <Badge tone={statusTone(a.condition)}>{a.condition}</Badge>
              </div>
              <div className="text-[11px] text-dim">{a.asset_type} · {a.ward}</div>
            </Card>
          ))}

        {sub === "requests" && requests.length === 0 && <div className="text-xs text-dim text-center py-6 col-span-2">No service requests logged yet.</div>}
        {sub === "requests" &&
          requests.map((r) => (
            <Card key={r.id} tone={statusTone(r.status)} className="p-3.5 mb-2 lg:mb-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-[11px] text-dim">{r.category} · {r.ward} · via {r.channel}</div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <div className="text-sm text-ink leading-relaxed mb-2">{r.description}</div>
              <div className="text-[10.5px] text-faint">{r.raised_by} · {new Date(r.created_at).toLocaleDateString([], { day: "numeric", month: "short" })}</div>
            </Card>
          ))}
      </div>
    </div>
  );
}
