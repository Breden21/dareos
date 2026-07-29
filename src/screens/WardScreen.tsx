import React, { useState } from "react";
import { Card, Badge, statusTone } from "../components/ui/atoms";
import { assets, requests } from "../lib/mockData";

export function WardScreen() {
  const [sub, setSub] = useState<"assets" | "requests">("assets");

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[900px]">
      <div className="flex gap-1.5 mb-4">
        {(["assets", "requests"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-1 lg:flex-none lg:px-6 py-2.5 px-2 rounded-lg text-xs font-semibold border ${
              sub === key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            {key === "assets" ? "Infrastructure" : "Service requests"}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        {sub === "assets" &&
          assets.map((a) => (
            <Card key={a.id} tone={statusTone(a.condition)} className="p-3.5 mb-2 lg:mb-0">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="text-sm font-medium text-ink">{a.name}</div>
                <Badge tone={statusTone(a.condition)}>{a.condition}</Badge>
              </div>
              <div className="text-[11px] text-dim">{a.type} · {a.ward} · {a.id}</div>
            </Card>
          ))}

        {sub === "requests" &&
          requests.map((r) => (
            <Card key={r.id} tone={statusTone(r.status)} className="p-3.5 mb-2 lg:mb-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-[11px] text-dim">{r.category} · {r.ward} · via {r.channel}</div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <div className="text-sm text-ink leading-relaxed mb-2">{r.desc}</div>
              <div className="text-[10.5px] text-faint">{r.raisedBy} · {r.date}</div>
            </Card>
          ))}
      </div>
    </div>
  );
}
