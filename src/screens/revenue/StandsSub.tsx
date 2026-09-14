import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, Badge, statusTone } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";

interface StandRow {
  id: string;
  stand_number: string;
  ward: string;
  buyer_name: string;
  price: number;
  amount_paid: number;
  status: string;
  date_allocated: string;
}

const STAND_TYPES = ["Residential", "Commercial", "Market stall"];
const STATUSES = ["Unpaid", "Instalments", "Paid up"];

export function StandsSub() {
  const [stands, setStands] = useState<StandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [standNumber, setStandNumber] = useState("");
  const [ward, setWard] = useState("");
  const [standType, setStandType] = useState(STAND_TYPES[0]);
  const [buyerName, setBuyerName] = useState("");
  const [price, setPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [status, setStatus] = useState(STATUSES[0]);
  const [dateAllocated, setDateAllocated] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const { data, error } = await supabase
      .from("land_stands")
      .select("id, stand_number, ward, buyer_name, price, amount_paid, status, date_allocated")
      .order("date_allocated", { ascending: false });
    if (error) setError("Couldn't load land stand records.");
    else setStands(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setStandNumber("");
    setWard("");
    setStandType(STAND_TYPES[0]);
    setBuyerName("");
    setPrice("");
    setAmountPaid("");
    setStatus(STATUSES[0]);
    setDateAllocated(new Date().toISOString().slice(0, 10));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    const { error } = await supabase.from("land_stands").insert({
      stand_number: standNumber,
      ward,
      stand_type: standType,
      buyer_name: buyerName,
      price: Number(price) || 0,
      amount_paid: Number(amountPaid) || 0,
      status,
      date_allocated: dateAllocated,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Couldn't save this stand. Check the details and try again.");
      return;
    }
    resetForm();
    setAdding(false);
    await load();
  }

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;
  if (error) return <div className="text-sm text-danger text-center pt-8">{error}</div>;

  return (
    <div>
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add a stand
        </button>
      )}

      {adding && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-semibold text-ink mb-3">New land stand</div>
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
            <input value={amountPaid} onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Amount paid so far ($)" inputMode="decimal" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={dateAllocated} onChange={(e) => setDateAllocated(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
          </div>
          {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
            <button
              onClick={submit}
              disabled={!standNumber || !ward || !buyerName || !price || submitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save stand"}
            </button>
          </div>
        </Card>
      )}

      {stands.length === 0 && <div className="text-sm text-dim text-center pt-4 px-6">No land stand records yet.</div>}
      {stands.map((s) => {
        const pct = Math.round((Number(s.amount_paid) / Number(s.price)) * 100);
        const tone = s.status === "Paid up" ? "success" : s.status === "Unpaid" ? "danger" : "warn";
        return (
          <Card key={s.id} tone={tone} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <div className="text-sm font-medium text-ink">{s.buyer_name}</div>
                <div className="text-[11px] text-dim">
                  {s.stand_number} · {s.ward} · allocated {new Date(s.date_allocated).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </div>
            <div className="flex justify-between text-[11.5px] mb-1.5">
              <span className="text-dim">${s.amount_paid} of ${s.price}</span>
              <span className="text-ink font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
