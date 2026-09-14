import React, { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Card, Badge, statusTone } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account } from "../lib/types";

interface AssetRow {
  id: string;
  name: string;
  asset_type: string;
  condition: string;
}
interface RequestRow {
  id: string;
  category: string;
  channel: string;
  description: string;
  status: string;
  raised_by: string;
  created_at: string;
}

const CONDITIONS = ["Working", "Needs repair", "Poor"];
const CHANNELS = ["In person", "Phone", "WhatsApp", "USSD"];
const STATUSES = ["Open", "In progress", "Resolved"];

export function WardOfficerHome({ account }: { account: Account }) {
  const [sub, setSub] = useState<"assets" | "requests">("assets");
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [category, setCategory] = useState("");
  const [channel, setChannel] = useState("In person");
  const [description, setDescription] = useState("");
  const [raisedBy, setRaisedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [{ data: assetData }, { data: requestData }] = await Promise.all([
      supabase.from("assets").select("id, name, asset_type, condition").eq("category", "infrastructure"),
      supabase.from("service_requests").select("id, category, channel, description, status, raised_by, created_at").order("created_at", { ascending: false }),
    ]);
    setAssets(assetData ?? []);
    setRequests(requestData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateCondition(id: string, condition: string) {
    await supabase.from("assets").update({ condition }).eq("id", id);
    await load();
  }

  async function updateRequestStatus(id: string, status: string) {
    await supabase.from("service_requests").update({ status }).eq("id", id);
    await load();
  }

  async function submitRequest() {
    setSubmitting(true);
    await supabase.from("service_requests").insert({
      ward: account.ward,
      category,
      channel,
      description,
      raised_by: raisedBy || "Anonymous",
    });
    setSubmitting(false);
    setLogging(false);
    setCategory("");
    setDescription("");
    setRaisedBy("");
    await load();
  }

  if (loading) return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading...</div>;

  const issues = assets.filter((a) => a.condition !== "Working").length + requests.filter((r) => r.status !== "Resolved").length;

  return (
    <div className="px-3.5 pt-4 pb-6">
      <div className="rounded-[18px] p-6 mb-6 bg-gradient-to-br from-chrome to-chromeAlt">
        <div className="flex items-center gap-2 mb-1.5">
          <MapPin size={15} className="text-accent" />
          <span className="text-[11.5px] text-chromeFaint tracking-wide">{account.ward?.toUpperCase()}</span>
        </div>
        <div className="font-display text-lg font-semibold text-white">
          {issues} item{issues !== 1 ? "s" : ""} need attention in your ward
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {(["assets", "requests"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-semibold border ${
              sub === key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            {key === "assets" ? "Infrastructure" : "Service requests"}
          </button>
        ))}
      </div>

      {sub === "assets" && (
        <>
          {assets.length === 0 && <div className="text-xs text-dim text-center py-6">No infrastructure assets recorded for your ward yet.</div>}
          {assets.map((a) => (
            <Card key={a.id} tone={statusTone(a.condition)} className="p-3.5 mb-2">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-sm font-medium text-ink">{a.name}</div>
                <Badge tone={statusTone(a.condition)}>{a.condition}</Badge>
              </div>
              <div className="text-[11px] text-dim mb-2.5">{a.asset_type}</div>
              <div className="flex gap-1.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateCondition(a.id, c)}
                    disabled={c === a.condition}
                    className={`flex-1 py-1.5 rounded-md text-[10.5px] font-semibold border ${
                      c === a.condition ? "border-border bg-bg text-faint" : "border-border bg-surface text-ink"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </>
      )}

      {sub === "requests" && (
        <>
          {!logging && (
            <button
              onClick={() => setLogging(true)}
              className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Log a service request
            </button>
          )}

          {logging && (
            <Card className="p-4 mb-4">
              <div className="text-sm font-semibold text-ink mb-3">New service request</div>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g. Water, Roads, Sanitation)"
                className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5"
              />
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5"
              >
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue"
                rows={3}
                className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5"
              />
              <input
                value={raisedBy}
                onChange={(e) => setRaisedBy(e.target.value)}
                placeholder="Raised by (name, optional)"
                className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setLogging(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  disabled={!category || !description || submitting}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </Card>
          )}

          {requests.length === 0 && <div className="text-xs text-dim text-center py-6">No service requests logged for your ward yet.</div>}
          {requests.map((r) => (
            <Card key={r.id} tone={statusTone(r.status)} className="p-3.5 mb-2">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-[11px] text-dim">{r.category} · via {r.channel}</div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <div className="text-sm text-ink leading-relaxed mb-2">{r.description}</div>
              <div className="text-[10.5px] text-faint mb-2.5">{r.raised_by} · {new Date(r.created_at).toLocaleDateString([], { day: "numeric", month: "short" })}</div>
              {r.status !== "Resolved" && (
                <div className="flex gap-1.5">
                  {STATUSES.filter((s) => s !== r.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateRequestStatus(r.id, s)}
                      className="flex-1 py-1.5 rounded-md text-[10.5px] font-semibold border border-border bg-surface text-ink"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
