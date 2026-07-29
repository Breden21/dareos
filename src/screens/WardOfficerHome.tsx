import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, Badge, statusTone } from "../components/ui/atoms";
import { assets, requests } from "../lib/mockData";
import type { Account } from "../lib/types";

export function WardOfficerHome({ account }: { account: Account }) {
  const [sub, setSub] = useState<"assets" | "requests">("assets");
  const myAssets = assets.filter((a) => a.ward === account.ward);
  const myRequests = requests.filter((r) => r.ward === account.ward);
  const issues = myAssets.filter((a) => a.condition !== "Working").length + myRequests.filter((r) => r.status !== "Resolved").length;

  return (
    <div className="px-3.5 pt-4 pb-6">
      <div className="rounded-[18px] p-6 mb-6 bg-gradient-to-br from-chrome to-chromeAlt">
        <div className="flex items-center gap-2 mb-1.5">
          <MapPin size={15} className="text-accent" />
          <span className="text-[11.5px] text-chromeFaint tracking-wide">{account.ward?.toUpperCase()}</span>
        </div>
        <div className="font-display text-lg font-semibold text-white">
          {issues} item{issues !== 1 ? "s" : ""} need attention in your ward
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {(["assets", "requests"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-semibold border ${
              sub === key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            {key === "assets" ? "Infrastructure" : "Service requests"}
          </button>
        ))}
      </div>

      {sub === "assets" &&
        myAssets.map((a) => (
          <Card key={a.id} tone={statusTone(a.condition)} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div className="text-sm font-medium text-ink">{a.name}</div>
              <Badge tone={statusTone(a.condition)}>{a.condition}</Badge>
            </div>
            <div className="text-[11px] text-dim">{a.type} · {a.id}</div>
          </Card>
        ))}

      {sub === "requests" &&
        myRequests.map((r) => (
          <Card key={r.id} tone={statusTone(r.status)} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="text-[11px] text-dim">{r.category} · via {r.channel}</div>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
            <div className="text-sm text-ink leading-relaxed mb-2">{r.desc}</div>
            <div className="text-[10.5px] text-faint">{r.raisedBy} · {r.date}</div>
          </Card>
        ))}
    </div>
  );
}
