import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card, SectionHeader, IconChip } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account } from "../lib/types";

interface ReceiptRow {
  id: string;
  fee_type: string;
  amount: number;
  receipt_number: string;
  banked: boolean;
  voided: boolean;
  voided_reason: string | null;
  created_at: string;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function CollectorHistory({ account }: { account: Account }) {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!account.collectionPointId) return;

    supabase
      .from("receipts")
      .select("id, fee_type, amount, receipt_number, banked, voided, voided_reason, created_at")
      .eq("point_id", account.collectionPointId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("Couldn't load your receipt history.");
        else setReceipts(data ?? []);
        setLoading(false);
      });
  }, [account.collectionPointId]);

  if (loading) return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading...</div>;
  if (error) return <div className="px-3.5 pt-8 text-sm text-danger text-center">{error}</div>;

  const total = receipts.filter((r) => !r.voided).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card tone="accent" className="p-4 mb-4.5 flex justify-between items-center">
        <div>
          <div className="text-[11px] text-dim">TOTAL RECEIPTED</div>
          <div className="font-display text-xl font-semibold text-ink">${total}</div>
        </div>
        <IconChip icon={ClipboardList} tone="accent" />
      </Card>
      <SectionHeader title="All receipts" />
      <Card className="overflow-hidden">
        {receipts.length === 0 && <div className="px-3.5 py-4 text-xs text-dim text-center">No receipts recorded yet.</div>}
        {receipts.map((r, i, arr) => (
          <div key={r.id} className={`flex justify-between items-center px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <div className={r.voided ? "opacity-50" : ""}>
              <div className={`text-sm text-ink ${r.voided ? "line-through" : ""}`}>{r.fee_type}</div>
              <div className="text-[10.5px] text-faint mt-0.5">
                {r.receipt_number} · {r.voided ? `Voided — ${r.voided_reason}` : formatWhen(r.created_at)}
              </div>
            </div>
            <div className={`text-sm font-semibold ${r.voided ? "text-faint line-through" : "text-success"}`}>+${r.amount}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
