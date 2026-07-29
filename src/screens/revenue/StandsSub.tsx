import React from "react";
import { Card, Badge, statusTone } from "../../components/ui/atoms";
import { stands } from "../../lib/mockData";

export function StandsSub() {
  return (
    <div>
      {stands.map((s) => {
        const pct = Math.round((s.paid / s.price) * 100);
        const tone = s.status === "Paid up" ? "success" : s.status === "Unpaid" ? "danger" : "warn";
        return (
          <Card key={s.id} tone={tone} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <div className="text-sm font-medium text-ink">{s.buyer}</div>
                <div className="text-[11px] text-dim">{s.id} · {s.ward} · allocated {s.dateAllocated}</div>
              </div>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </div>
            <div className="flex justify-between text-[11.5px] mb-1.5">
              <span className="text-dim">${s.paid} of ${s.price}</span>
              <span className="text-ink font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
