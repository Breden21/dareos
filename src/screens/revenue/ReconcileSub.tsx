import React, { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Card, Badge } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";
import type { Account } from "../../lib/types";

interface PointRow {
  id: string;
  name: string;
}
interface ReceiptRow {
  id: string;
  point_id: string;
  amount: number;
  banked: boolean;
  voided: boolean;
  created_at: string;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function ReconcileSub({ account }: { account: Account }) {
  const [points, setPoints] = useState<PointRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [collectors, setCollectors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function load() {
    // Every still-unbanked receipt regardless of age, plus today's already-
    // banked ones for context - reconciliation must never let an unbanked
    // receipt quietly fall out of view just because a day has passed.
    const [{ data: pointData }, { data: receiptData }, { data: profileData }] = await Promise.all([
      supabase.from("collection_points").select("id, name"),
      supabase
        .from("receipts")
        .select("id, point_id, amount, banked, voided, created_at")
        .eq("voided", false)
        .or(`banked.eq.false,created_at.gte.${startOfToday()}`),
      supabase.from("profiles").select("collection_point_id, name").eq("role", "collector"),
    ]);
    setPoints(pointData ?? []);
    setReceipts(receiptData ?? []);
    const map: Record<string, string> = {};
    (profileData ?? []).forEach((p) => {
      if (p.collection_point_id) map[p.collection_point_id] = p.name;
    });
    setCollectors(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmBanked(pointId: string) {
    setConfirming(pointId);
    // No date filter here on purpose - this clears the full backlog for the
    // point, not just today's receipts.
    await supabase
      .from("receipts")
      .update({ banked: true, banked_at: new Date().toISOString(), banked_by: account.id })
      .eq("point_id", pointId)
      .eq("banked", false)
      .eq("voided", false);
    await load();
    setConfirming(null);
  }

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;

  const pointsWithActivity = points.filter((p) => receipts.some((r) => r.point_id === p.id));
  const unbankedCount = pointsWithActivity.filter((p) => receipts.some((r) => r.point_id === p.id && !r.banked)).length;

  return (
    <div>
      <Card tone="warn" className="p-4 mb-7">
        <div className="flex gap-2.5 items-start">
          <AlertTriangle size={18} className="text-warn flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-ink mb-1">
              {unbankedCount} collection point{unbankedCount !== 1 ? "s" : ""} unbanked today
            </div>
            <div className="text-xs text-dim leading-relaxed">
              Collections recorded via receipts but not yet confirmed deposited to council bank account.
            </div>
          </div>
        </div>
      </Card>

      {pointsWithActivity.length === 0 && (
        <div className="text-xs text-dim text-center py-4">No collections recorded yet today.</div>
      )}

      {pointsWithActivity.map((p) => {
        const pointReceipts = receipts.filter((r) => r.point_id === p.id);
        const unbankedReceipts = pointReceipts.filter((r) => !r.banked);
        const pendingTotal = unbankedReceipts.reduce((s, r) => s + Number(r.amount), 0);
        const banked = unbankedReceipts.length === 0;
        const oldestPending = unbankedReceipts.length
          ? unbankedReceipts.reduce((oldest, r) => (r.created_at < oldest ? r.created_at : oldest), unbankedReceipts[0].created_at)
          : null;
        const isBacklog = oldestPending && new Date(oldestPending) < new Date(startOfToday());
        return (
          <Card key={p.id} tone={banked ? "success" : "warn"} className="p-3.5 mb-2">
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium text-ink">{p.name}</div>
              <Badge tone={banked ? "success" : "warn"}>{banked ? "Reconciled" : "Pending"}</Badge>
            </div>
            <div className={`flex justify-between text-[11.5px] text-dim ${!banked ? "mb-1" : ""}`}>
              <span>{banked ? "Receipted today" : "Pending"}: ${banked ? pointReceipts.reduce((s, r) => s + Number(r.amount), 0) : pendingTotal}</span>
              <span>Collector: {collectors[p.id] ?? "Unassigned"}</span>
            </div>
            {isBacklog && (
              <div className="text-[11px] text-danger mb-2.5">
                Includes collections since {new Date(oldestPending!).toLocaleDateString([], { day: "numeric", month: "short" })} — overdue
              </div>
            )}
            {!banked && (
              <button
                onClick={() => confirmBanked(p.id)}
                disabled={confirming === p.id}
                className="w-full py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-ink flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check size={13} /> {confirming === p.id ? "Confirming..." : "Confirm banked"}
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
