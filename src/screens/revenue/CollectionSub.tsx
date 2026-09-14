import React, { useEffect, useState } from "react";
import { Card, Badge, SectionHeader, BackRow } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";
import type { Account } from "../../lib/types";

interface PointRow {
  id: string;
  name: string;
  ward: string;
  fee_category: string;
}
interface ReceiptRow {
  id: string;
  point_id: string;
  fee_type: string;
  amount: number;
  banked: boolean;
  voided: boolean;
  voided_reason: string | null;
  created_at: string;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function CollectionSub({ account }: { account: Account }) {
  const [points, setPoints] = useState<PointRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [collectors, setCollectors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const [{ data: pointData }, { data: receiptData }, { data: profileData }] = await Promise.all([
      supabase.from("collection_points").select("id, name, ward, fee_category"),
      supabase
        .from("receipts")
        .select("id, point_id, fee_type, amount, banked, voided, voided_reason, created_at")
        .or(`voided.eq.true,created_at.gte.${startOfToday()}`),
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

  async function voidReceipt(id: string) {
    const reason = window.prompt("Why is this collection being voided?");
    if (!reason) return;
    const { error } = await supabase
      .from("receipts")
      .update({ voided: true, voided_reason: reason, voided_by: account.id, voided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      window.alert("Couldn't void this collection.");
      return;
    }
    await load();
  }

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;

  const selected = points.find((p) => p.id === selectedId) || null;

  if (selected) {
    const pointReceipts = receipts.filter((r) => r.point_id === selected.id);
    const activeReceipts = pointReceipts.filter((r) => !r.voided);
    const todayTotal = activeReceipts.reduce((s, r) => s + Number(r.amount), 0);
    const banked = activeReceipts.length > 0 && activeReceipts.every((r) => r.banked);
    return (
      <div>
        <BackRow onBack={() => setSelectedId(null)} label="Collection points" />
        <div className="mb-4">
          <div className="font-display text-lg font-semibold text-ink mb-0.5">{selected.name}</div>
          <div className="text-xs text-dim">
            {selected.fee_category} · {selected.ward} · Collector: {collectors[selected.id] ?? "Unassigned"}
          </div>
        </div>
        <Card tone={banked ? "success" : "warn"} className="p-4 mb-4 text-center">
          <div className="text-[11px] text-dim mb-1.5">COLLECTED TODAY</div>
          <div className="font-display text-3xl font-semibold text-ink mb-2">${todayTotal}</div>
          <Badge tone={banked ? "success" : "warn"}>
            {activeReceipts.length === 0 ? "No collections yet" : banked ? "Banked" : "Not yet banked"}
          </Badge>
        </Card>
        <SectionHeader title="Receipts today" />
        {pointReceipts.length === 0 && <div className="text-xs text-dim text-center py-4">No receipts yet today.</div>}
        {pointReceipts.map((r) => (
          <Card key={r.id} className="p-3.5 mb-2">
            <div className="flex justify-between items-start">
              <span className={`text-xs ${r.voided ? "text-faint line-through" : "text-ink"}`}>{r.fee_type}</span>
              <span className={`text-sm font-semibold ${r.voided ? "text-faint line-through" : "text-success"}`}>+${r.amount}</span>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-[11px] text-faint">
                {r.voided
                  ? `Voided — ${r.voided_reason} (collected ${new Date(r.created_at).toLocaleDateString([], { day: "numeric", month: "short" })})`
                  : new Date(r.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              {!r.voided && (
                <button onClick={() => voidReceipt(r.id)} className="text-[10.5px] text-danger underline">
                  Void
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-3">
      {points.map((p) => {
        const pointReceipts = receipts.filter((r) => r.point_id === p.id);
        const activeReceipts = pointReceipts.filter((r) => !r.voided);
        const todayTotal = activeReceipts.reduce((s, r) => s + Number(r.amount), 0);
        const banked = activeReceipts.length > 0 && activeReceipts.every((r) => r.banked);
        return (
          <Card key={p.id} tone={banked ? "success" : "warn"} onClick={() => setSelectedId(p.id)} className="p-3.5 mb-2 lg:mb-0">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div className="text-sm font-medium text-ink">{p.name}</div>
              <Badge tone={banked ? "success" : "warn"}>
                {activeReceipts.length === 0 ? "No activity" : banked ? "Banked" : "Unbanked"}
              </Badge>
            </div>
            <div className="flex justify-between text-[11.5px] text-dim">
              <span>{p.fee_category} · {collectors[p.id] ?? "Unassigned"}</span>
              <span className="font-semibold text-ink">${todayTotal}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
