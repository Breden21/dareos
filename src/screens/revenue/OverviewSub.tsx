import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, SectionHeader } from "../../components/ui/atoms";
import { revenueOverview } from "../../lib/mockData";

export function OverviewSub() {
  const pct = Math.round((revenueOverview.collectedThisMonth / revenueOverview.targetThisMonth) * 100);
  return (
    <div>
      <Card className="p-5 pb-5.5 mb-4.5 text-center bg-gradient-to-br from-chrome to-chromeAlt border-0">
        <div className="text-[11px] text-chromeFaint mb-1.5 tracking-wide">COLLECTED — JULY 2026</div>
        <div className="font-display text-4xl font-semibold text-white mb-1">
          ${revenueOverview.collectedThisMonth.toLocaleString()}
        </div>
        <div className="text-xs text-chromeFaint mb-3">of ${revenueOverview.targetThisMonth.toLocaleString()} target</div>
        <div className="h-2 bg-white/15 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </Card>

      <SectionHeader title="By levy type" />
      {revenueOverview.levyTypes.map((l) => (
        <Card key={l.name} tone={l.delta >= 0 ? "success" : "danger"} className="p-3.5 mb-2 flex justify-between items-center">
          <div>
            <div className="text-sm text-ink font-medium">{l.name}</div>
            <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${l.delta >= 0 ? "text-success" : "text-danger"}`}>
              {l.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(l.delta)}% vs last month
            </div>
          </div>
          <div className="font-display text-lg font-semibold text-ink">${l.collected.toLocaleString()}</div>
        </Card>
      ))}
    </div>
  );
}
