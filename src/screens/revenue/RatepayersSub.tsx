import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, Badge, SectionHeader, statusTone } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";

interface RatepayerRow {
  id: string;
  name: string;
  ward: string;
  type: string;
  balance: number;
  status: string;
  last_payment: string | null;
}

const STATUSES = ["Current", "Arrears"];

function RatepayerCard({ r }: { r: RatepayerRow }) {
  const tone = r.status === "Arrears" ? "danger" : "success";
  return (
    <Card tone={tone} className="p-3.5 mb-2">
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="text-sm font-medium text-ink">{r.name}</div>
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      </div>
      <div className="flex justify-between text-[11px] text-dim">
        <span>{r.type} · {r.ward}</span>
        {r.balance > 0 ? (
          <span className="text-danger font-semibold">${r.balance} due</span>
        ) : (
          <span>{r.last_payment ? `Paid ${new Date(r.last_payment).toLocaleDateString([], { day: "numeric", month: "short" })}` : "No payments yet"}</span>
        )}
      </div>
    </Card>
  );
}

export function RatepayersSub() {
  const [ratepayers, setRatepayers] = useState<RatepayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [name, setName] = useState("");
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState(STATUSES[0]);
  const [lastPayment, setLastPayment] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("ratepayers")
      .select("id, name, ward, type, balance, status, last_payment")
      .order("name");
    if (error) setError("Couldn't load ratepayer accounts.");
    else setRatepayers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setName("");
    setWard("");
    setType("");
    setBalance("");
    setStatus(STATUSES[0]);
    setLastPayment("");
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    const { error } = await supabase.from("ratepayers").insert({
      name,
      ward,
      type,
      balance: Number(balance) || 0,
      status,
      last_payment: lastPayment || null,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Couldn't save this account. Check the details and try again.");
      return;
    }
    resetForm();
    setAdding(false);
    await load();
  }

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;
  if (error) return <div className="text-sm text-danger text-center pt-8">{error}</div>;

  const arrears = ratepayers.filter((r) => r.status === "Arrears");
  const current = ratepayers.filter((r) => r.status === "Current");

  return (
    <div>
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add a ratepayer account
        </button>
      )}

      {adding && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-semibold text-ink mb-3">New ratepayer account</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name / business name" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Business licence)" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <input value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Outstanding balance ($)" inputMode="decimal" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="text-[11px] font-semibold text-ink mb-1 block">Last payment date (optional)</label>
          <input type="date" value={lastPayment} onChange={(e) => setLastPayment(e.target.value)} className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4" />
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
            <button
              onClick={submit}
              disabled={!name || !ward || !type || submitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save account"}
            </button>
          </div>
        </Card>
      )}

      {ratepayers.length === 0 && <div className="text-sm text-dim text-center pt-4 px-6">No ratepayer accounts yet.</div>}
      {arrears.length > 0 && (
        <>
          <SectionHeader title={`In arrears (${arrears.length})`} />
          <div className="lg:grid lg:grid-cols-2 lg:gap-3">
            {arrears.map((r) => <RatepayerCard key={r.id} r={r} />)}
          </div>
        </>
      )}
      {current.length > 0 && (
        <>
          <SectionHeader title="Current accounts" />
          <div className="lg:grid lg:grid-cols-2 lg:gap-3">
            {current.map((r) => <RatepayerCard key={r.id} r={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
