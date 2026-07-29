import React from "react";
import { Fuel, Radio } from "lucide-react";
import { Card, Badge, SectionHeader, statusTone } from "../components/ui/atoms";
import { fleet, staff, minutes } from "../lib/mockData";
import type { Vehicle } from "../lib/types";

function FleetCard({ v }: { v: Vehicle }) {
  const fuelColor = v.fuel < 30 ? "text-danger" : v.fuel < 55 ? "text-warn" : "text-success";
  return (
    <Card tone={statusTone(v.status)} className="p-3.5 mb-2">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold text-ink">{v.type}</div>
          <div className="text-[11px] text-dim">{v.id} · {v.ward}</div>
        </div>
        <Badge tone={statusTone(v.status)}>{v.status}</Badge>
      </div>
      <div className="text-xs text-ink mb-2">{v.assignment === "assigned" ? `Assigned to ${v.assignedTo}` : v.task}</div>
      <div className="flex justify-between text-[11px] text-dim border-t border-border pt-2">
        <span className={`flex items-center gap-1 ${fuelColor}`}><Fuel size={11} />{v.fuel}%</span>
        <span>{v.odometer.toLocaleString()} km</span>
        <span className="flex items-center gap-1"><Radio size={11} />{v.lastPing}</span>
      </div>
    </Card>
  );
}

export function MoreScreen() {
  const needsAttention = fleet.filter((v) => v.status === "Refuel needed" || v.status === "Maintenance");
  const rest = fleet.filter((v) => !needsAttention.includes(v));

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[1100px]">
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionHeader title="Fleet" />
          {needsAttention.map((v) => <FleetCard key={v.id} v={v} />)}
          {rest.map((v) => <FleetCard key={v.id} v={v} />)}
        </div>

        <div>
          <div className="mt-4.5 lg:mt-0">
            <SectionHeader title="Establishment" />
            {staff.map((d) => {
              const pct = Math.round((d.filled / d.establishment) * 100);
              const gap = d.establishment - d.filled;
              return (
                <Card key={d.dept} className="p-3.5 mb-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink font-medium">{d.dept}</span>
                    <span className="text-dim">
                      {d.filled}/{d.establishment}
                      {gap > 0 && <span className="text-danger"> · {gap} vacant</span>}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-4.5">
            <SectionHeader title="Council resolutions" />
            {minutes.map((m) => (
              <Card key={m.id} className="p-3.5 mb-2 border-l-[3px] border-l-accent">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-semibold text-ink">{m.committee}</span>
                  <span className="text-[11px] text-faint">{m.date}</span>
                </div>
                <ul className="pl-4 m-0 list-disc">
                  {m.resolutions.map((r, i) => (
                    <li key={i} className="text-xs text-dim leading-relaxed mb-0.5">{r}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
