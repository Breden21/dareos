import React, { useState } from "react";
import { Fuel, Check, Radio } from "lucide-react";
import { Card, Badge, SectionHeader, statusTone } from "../components/ui/atoms";
import { fleet } from "../lib/mockData";
import type { Account } from "../lib/types";

export function DriverHome({ account }: { account: Account }) {
  const vehicle = fleet.find((v) => v.id === account.vehicleId)!;
  const [taskDone, setTaskDone] = useState(false);
  const fuelColor = vehicle.fuel < 30 ? "text-danger" : vehicle.fuel < 55 ? "text-warn" : "text-success";
  const fuelHex = vehicle.fuel < 30 ? "#B33F3F" : vehicle.fuel < 55 ? "#C08A2E" : "#1F8A6F";

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card tone={statusTone(vehicle.status)} className="p-5 mb-6">
        <div className="flex justify-between items-start mb-3.5">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{vehicle.type}</div>
            <div className="text-[11.5px] text-dim mt-0.5">{vehicle.id} · {vehicle.ward}</div>
          </div>
          <Badge tone={statusTone(vehicle.status)}>{vehicle.status}</Badge>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold mb-1.5 ${fuelColor}`}>
          <Fuel size={14} /> {vehicle.fuel}% fuel
        </div>
        <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden mb-3.5">
          <div className="h-full rounded-full" style={{ width: `${vehicle.fuel}%`, background: fuelHex }} />
        </div>
        <div className="text-[11px] text-dim">{vehicle.odometer.toLocaleString()} km on the clock</div>
      </Card>

      <SectionHeader title="Current task" />
      <Card className="p-4 mb-4">
        <div className={`text-sm text-ink leading-relaxed ${taskDone ? "" : "mb-3.5"}`}>{vehicle.task || "No task assigned"}</div>
        {vehicle.task && !taskDone && (
          <button
            onClick={() => setTaskDone(true)}
            className="w-full py-3 rounded-lg bg-accent text-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> Mark task complete
          </button>
        )}
        {taskDone && <Badge tone="success">Marked complete</Badge>}
      </Card>

      <SectionHeader title="Last known location" />
      <Card className="p-3.5 flex items-center gap-2.5">
        <Radio size={16} className="text-dim" />
        <span className="text-xs text-ink">Last ping {vehicle.lastPing}</span>
      </Card>
    </div>
  );
}
