import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, Receipt as ReceiptIcon, FileText, Truck, Wrench, MessageSquare, Sunrise, Users, Landmark } from "lucide-react";
import { Card, Delta, SectionHeader, IconChip } from "../components/ui/atoms";
import { kpis, collectionPoints, recentReceipts, digitizedRecords, fleet, assets, requests, revenueOverview } from "../lib/mockData";
import type { Account, StatusTone } from "../lib/types";

function buildBriefingItems() {
  const items: { tone: StatusTone; text: string }[] = [];
  fleet.filter((v) => v.status === "Refuel needed" || v.status === "Maintenance").forEach((v) => {
    items.push({ tone: v.status === "Maintenance" ? "danger" : "warn", text: `${v.type} (${v.id}) — ${v.status.toLowerCase()}, ${v.ward}` });
  });
  assets.filter((a) => a.condition !== "Working").forEach((a) => {
    items.push({ tone: a.condition === "Poor" ? "danger" : "warn", text: `${a.name} — ${a.condition.toLowerCase()}` });
  });
  const openReq = requests.filter((r) => r.status === "Open" || r.status === "In progress").length;
  if (openReq > 0) items.push({ tone: "warn", text: `${openReq} ward service request${openReq !== 1 ? "s" : ""} awaiting response` });
  const pct = Math.round((revenueOverview.collectedThisMonth / revenueOverview.targetThisMonth) * 100);
  if (pct < 100) items.push({ tone: "neutral", text: `Revenue ${100 - pct}% below target this month` });
  return items.slice(0, 5);
}

function DistrictBriefing({ greetingName, compact }: { greetingName: string; compact?: boolean }) {
  const items = buildBriefingItems();
  const dotColor = (tone: StatusTone) => (tone === "danger" ? "#F5A9A0" : tone === "warn" ? "#F0CE8A" : "#8FA0B8");
  return (
    <div className={`rounded-[18px] relative overflow-hidden bg-gradient-to-br from-chrome to-chromeAlt ${compact ? "p-5 h-full" : "p-5 pb-4.5 mb-5"}`}>
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-accent/10" />
      <div className="flex items-center gap-2 mb-1 relative">
        <Sunrise size={16} className="text-accent" />
        <span className="text-[11.5px] text-chromeFaint tracking-wide">
          DISTRICT BRIEFING{greetingName ? ` · GOOD MORNING, ${greetingName.split(" ")[0].toUpperCase()}` : ""}
        </span>
      </div>
      <div className="font-display text-xl font-semibold text-white mb-3.5 relative">
        {items.length} priorities need your attention today
      </div>
      <div className="flex flex-col gap-2.5 relative">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor(item.tone) }} />
            <span className="text-[13px] text-[#F2F5F7] leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const kpiTone: Record<string, StatusTone> = {
  "Outstanding arrears": "danger",
  "Uncollected/unbanked": "warn",
  "Active fleet": "accent",
};

export function CeoDashboard({ account, onGo }: { account: Account; onGo: (tab: string, sub?: string) => void }) {
  const smallKpis = kpis.slice(1);
  const unbanked = collectionPoints.filter((p) => !p.banked);
  const activeCollectors = new Set(collectionPoints.map((p) => p.collector)).size;
  const openRequestsCount = requests.filter((r) => r.status !== "Resolved").length;
  const pct = Math.round((revenueOverview.collectedThisMonth / revenueOverview.targetThisMonth) * 100);
  const maxWard = Math.max(...revenueOverview.byWard.map((w) => w.collected));

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[1400px]">
      {/* Desktop-only greeting row */}
      <div className="hidden lg:block mb-6">
        <div className="font-display text-2xl font-semibold text-ink">Good morning, {account.name.split(" ")[0]} 👋</div>
        <div className="text-sm text-dim mt-1">Here's what's happening across Mutasa District today.</div>
      </div>

      {/* Mobile: district briefing leads */}
      <div className="lg:hidden">
        <DistrictBriefing greetingName={account.name} />
      </div>

      {/* Stat row — 3 cols mobile, 6 cols desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 mb-5 lg:mb-6">
        <Card className="p-3 lg:p-4">
          <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">{kpis[0].value}</div>
          <div className="text-[10px] lg:text-xs text-dim leading-snug">Revenue today</div>
          <div className="hidden lg:block mt-1.5"><Delta value={kpis[0].delta} up={kpis[0].up} /></div>
        </Card>
        <Card className="p-3 lg:p-4">
          <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">{activeCollectors}</div>
          <div className="text-[10px] lg:text-xs text-dim leading-snug">Active collectors</div>
        </Card>
        {smallKpis.map((k) => (
          <Card key={k.label} tone={kpiTone[k.label]} className="p-3 lg:p-4">
            <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">{k.value}</div>
            <div className="text-[10px] lg:text-xs text-dim leading-snug">{k.label}</div>
          </Card>
        ))}
        <Card tone={openRequestsCount > 0 ? "warn" : "success"} className="p-3 lg:p-4 hidden lg:block">
          <div className="font-display text-2xl font-semibold text-ink mb-0.5">{openRequestsCount}</div>
          <div className="text-xs text-dim leading-snug">Open requests</div>
        </Card>
      </div>

      {/* Desktop: 3-col grid — chart / ward ranking / district brief */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-semibold text-ink">Revenue overview</div>
              <div className="text-[11px] text-dim mt-0.5">This month</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-semibold text-ink">${revenueOverview.collectedThisMonth.toLocaleString()}</div>
              <div className="text-[11px] text-success font-medium">{pct}% of target</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={revenueOverview.trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#E4EAED" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DCE3E8" }} />
                <Line type="monotone" dataKey="target" stroke="#C2CDD5" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="collected" stroke="#2FBF95" strokeWidth={2.5} dot={{ r: 3, fill: "#2FBF95" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 col-span-1">
          <div className="text-sm font-semibold text-ink mb-0.5">Collections by ward</div>
          <div className="text-[11px] text-dim mb-4">Today</div>
          <div className="flex flex-col gap-3.5">
            {revenueOverview.byWard.map((w) => (
              <div key={w.ward}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink font-medium">{w.ward}</span>
                  <span className="text-dim">${w.collected.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[#E4EAED] rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(w.collected / maxWard) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-1">
          <DistrictBriefing greetingName="" compact />
        </div>
      </div>

      {/* Activity panels — stacked mobile, 3-col desktop */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        <div>
          <SectionHeader title="Unbanked collections" action="Reconcile" onAction={() => onGo("revenue", "reconcile")} />
          <Card className="mb-5 lg:mb-0 overflow-hidden">
            {unbanked.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < unbanked.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={Wallet} tone="warn" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{p.name}</div>
                  <div className="text-[11px] text-dim">{p.collector} · {p.lastReceipt}</div>
                </div>
                <div className="text-sm font-semibold text-warn">${p.todayTotal}</div>
              </div>
            ))}
          </Card>
        </div>

        <div className="lg:mt-0">
          <SectionHeader title="Recent receipts" action="View all" onAction={() => onGo("revenue", "collection")} />
          <Card className="mb-5 lg:mb-0 overflow-hidden">
            {recentReceipts.slice(0, 2).map((r, i, arr) => (
              <div key={r.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={ReceiptIcon} tone="success" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{r.payer}</div>
                  <div className="text-[11px] text-dim">{r.point} · {r.collector}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-1">
                  <div className="text-sm font-semibold text-success">+${r.amount}</div>
                  <div className="text-[10.5px] text-faint">{r.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionHeader title="Recently digitized" action="View all" onAction={() => onGo("records")} />
          <Card className="overflow-hidden">
            {digitizedRecords.slice(0, 2).map((d, i, arr) => (
              <div key={d.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={FileText} tone="accent" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{d.title}</div>
                  <div className="text-[11px] text-dim">{d.category} · {d.ward}</div>
                </div>
                <div className="text-[10.5px] text-faint flex-shrink-0">{d.time}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
