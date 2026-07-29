import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Card, Badge, SectionHeader, BackRow } from "../../components/ui/atoms";
import { collectionPoints, recentReceipts } from "../../lib/mockData";
import type { CollectionPoint } from "../../lib/types";

export function CollectionSub() {
  const [selected, setSelected] = useState<CollectionPoint | null>(null);
  const [issued, setIssued] = useState(false);

  if (selected) {
    const pointReceipts = recentReceipts.filter((r) => r.collector === selected.collector && r.time !== "yesterday");
    return (
      <div>
        <BackRow onBack={() => { setSelected(null); setIssued(false); }} label="Collection points" />
        <div className="mb-4">
          <div className="font-display text-lg font-semibold text-ink mb-0.5">{selected.name}</div>
          <div className="text-xs text-dim">{selected.type} · {selected.ward} · Collector: {selected.collector}</div>
        </div>
        <Card tone={selected.banked ? "success" : "warn"} className="p-4 mb-4 text-center">
          <div className="text-[11px] text-dim mb-1.5">COLLECTED TODAY</div>
          <div className="font-display text-3xl font-semibold text-ink mb-2">${selected.todayTotal}</div>
          <Badge tone={selected.banked ? "success" : "warn"}>{selected.banked ? "Banked" : "Not yet banked"}</Badge>
        </Card>
        <button
          onClick={() => setIssued(true)}
          disabled={issued}
          className={`w-full py-3.5 rounded-lg text-sm font-semibold mb-2.5 flex items-center justify-center gap-1.5 ${
            issued ? "bg-successSoft text-success" : "bg-accent text-white"
          }`}
        >
          {issued ? <Check size={16} /> : <Plus size={16} />} {issued ? "Receipt issued" : "Issue receipt"}
        </button>
        <SectionHeader title="Receipts today" />
        {pointReceipts.map((r) => (
          <Card key={r.id} className="p-3.5 mb-2">
            <div className="flex justify-between">
              <span className="text-xs text-ink">{r.payer}</span>
              <span className="text-sm font-semibold text-success">+${r.amount}</span>
            </div>
            <div className="text-[11px] text-faint mt-0.5">{r.id} · {r.time}</div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-3">
      {collectionPoints.map((p) => (
        <Card key={p.id} tone={p.banked ? "success" : "warn"} onClick={() => setSelected(p)} className="p-3.5 mb-2 lg:mb-0">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <div className="text-sm font-medium text-ink">{p.name}</div>
            <Badge tone={p.banked ? "success" : "warn"}>{p.banked ? "Banked" : "Unbanked"}</Badge>
          </div>
          <div className="flex justify-between text-[11.5px] text-dim">
            <span>{p.type} · {p.collector}</span>
            <span className="font-semibold text-ink">${p.todayTotal}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
