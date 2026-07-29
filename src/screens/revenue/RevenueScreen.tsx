import React, { useState } from "react";
import type { RevenueSub } from "../../lib/types";
import { OverviewSub } from "./OverviewSub";
import { CollectionSub } from "./CollectionSub";
import { RatepayersSub } from "./RatepayersSub";
import { StandsSub } from "./StandsSub";
import { ReconcileSub } from "./ReconcileSub";

const SUBS: [RevenueSub, string][] = [
  ["overview", "Overview"],
  ["collection", "Collection"],
  ["ratepayers", "Ratepayers"],
  ["stands", "Stands"],
  ["reconcile", "Reconcile"],
];

export function RevenueScreen({ initialSub }: { initialSub: RevenueSub }) {
  const [sub, setSub] = useState<RevenueSub>(initialSub);

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[1000px]">
      <div className="flex gap-1.5 mb-7 overflow-x-auto pb-0.5 lg:grid lg:grid-cols-5 lg:gap-3">
        {SUBS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-shrink-0 lg:flex-shrink py-2.5 px-3.5 rounded-lg text-xs font-semibold border text-center ${
              sub === key ? "border-accent bg-accentSoft text-accent" : "border-border bg-surface text-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === "overview" && <OverviewSub />}
      {sub === "collection" && <CollectionSub />}
      {sub === "ratepayers" && <RatepayersSub />}
      {sub === "stands" && <StandsSub />}
      {sub === "reconcile" && <ReconcileSub />}
    </div>
  );
}
