import React, { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Card, Badge } from "../../components/ui/atoms";
import { collectionPoints as initialPoints } from "../../lib/mockData";

export function ReconcileSub() {
  const [points, setPoints] = useState(initialPoints);
  const unbankedCount = points.filter((p) => !p.banked).length;

  function confirmBanked(id: string) {
    setPoints(points.map((p) => (p.id === id ? { ...p, banked: true } : p)));
  }

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

      {points.map((p) => (
        <Card key={p.id} tone={p.banked ? "success" : "warn"} className="p-3.5 mb-2">
          <div className="flex justify-between mb-2">
            <div className="text-sm font-medium text-ink">{p.name}</div>
            <Badge tone={p.banked ? "success" : "warn"}>{p.banked ? "Reconciled" : "Pending"}</Badge>
          </div>
          <div className={`flex justify-between text-[11.5px] text-dim ${!p.banked ? "mb-2.5" : ""}`}>
            <span>Receipted: ${p.todayTotal}</span>
            <span>Collector: {p.collector}</span>
          </div>
          {!p.banked && (
            <button
              onClick={() => confirmBanked(p.id)}
              className="w-full py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-ink flex items-center justify-center gap-1.5"
            >
              <Check size={13} /> Confirm banked
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}
