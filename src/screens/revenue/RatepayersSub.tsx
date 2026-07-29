import React from "react";
import { Card, Badge, SectionHeader, statusTone } from "../../components/ui/atoms";
import { ratepayers } from "../../lib/mockData";
import type { Ratepayer } from "../../lib/types";

function RatepayerCard({ r }: { r: Ratepayer }) {
  const tone = r.status === "Arrears" ? "danger" : "success";
  return (
    <Card tone={tone} className="p-3.5 mb-2">
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="text-sm font-medium text-ink">{r.name}</div>
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      </div>
      <div className="flex justify-between text-[11px] text-dim">
        <span>{r.type} · {r.ward}</span>
        {r.balance > 0 ? <span className="text-danger font-semibold">${r.balance} due</span> : <span>Paid {r.lastPayment}</span>}
      </div>
    </Card>
  );
}

export function RatepayersSub() {
  const arrears = ratepayers.filter((r) => r.status === "Arrears");
  const current = ratepayers.filter((r) => r.status === "Current");
  return (
    <div>
      {arrears.length > 0 && (
        <>
          <SectionHeader title={`In arrears (${arrears.length})`} />
          <div className="lg:grid lg:grid-cols-2 lg:gap-3">
            {arrears.map((r) => <RatepayerCard key={r.id} r={r} />)}
          </div>
        </>
      )}
      <SectionHeader title="Current accounts" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        {current.map((r) => <RatepayerCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
