import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wallet, Receipt as ReceiptIcon, FileText, Sunrise } from "lucide-react";
import { Card, SectionHeader, IconChip } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account, StatusTone } from "../lib/types";

interface PointRow {
  id: string;
  name: string;
  ward: string;
}
interface ReceiptRow {
  id: string;
  point_id: string;
  amount: number;
  collector_name: string;
  banked: boolean;
  created_at: string;
}
interface DigitizedRow {
  id: string;
  title: string;
  category: string;
  ward: string;
  captured_by: string;
  created_at: string;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DistrictBriefing({ compact, items }: { compact?: boolean; items: { tone: StatusTone; text: string }[] }) {
  const dotColor = (tone: StatusTone) => (tone === "danger" ? "#F5A9A0" : tone === "warn" ? "#F0CE8A" : "#8FA0B8");
  return (
    <div className={`rounded-[18px] relative overflow-hidden bg-gradient-to-br from-chrome to-chromeAlt ${compact ? "p-5 h-full" : "p-5 pb-4.5 mb-5"}`}>
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-accent/10" />
      <div className="flex items-center gap-2 mb-1 relative">
        <Sunrise size={16} className="text-accent" />
        <span className="text-[11.5px] text-chromeFaint tracking-wide">
          DISTRICT BRIEFING · {timeGreeting().toUpperCase()}
        </span>
      </div>
      <div className="font-display text-xl font-semibold text-white mb-3.5 relative">
        {items.length === 0 ? "Nothing needs your attention right now" : `${items.length} priorities need your attention today`}
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

export function CeoDashboard({ account, onGo }: { account: Account; onGo: (tab: string, sub?: string) => void }) {
  const [points, setPoints] = useState<PointRow[]>([]);
  const [monthReceipts, setMonthReceipts] = useState<ReceiptRow[]>([]);
  const [unbankedReceipts, setUnbankedReceipts] = useState<ReceiptRow[]>([]);
  const [collectors, setCollectors] = useState<Record<string, string>>({});
  const [arrearsTotal, setArrearsTotal] = useState(0);
  const [openRequests, setOpenRequests] = useState(0);
  const [digitized, setDigitized] = useState<DigitizedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { data: pointData },
        { data: monthData },
        { data: unbankedData },
        { data: profileData },
        { data: ratepayerData },
        { data: requestData },
        { data: digitizedData },
      ] = await Promise.all([
        supabase.from("collection_points").select("id, name, ward"),
        supabase
          .from("receipts")
          .select("id, point_id, amount, collector_name, banked, created_at")
          .eq("voided", false)
          .gte("created_at", startOfMonth().toISOString()),
        supabase.from("receipts").select("id, point_id, amount, collector_name, banked, created_at").eq("voided", false).eq("banked", false),
        supabase.from("profiles").select("collection_point_id, name").eq("role", "collector"),
        supabase.from("ratepayers").select("balance").eq("status", "Arrears"),
        supabase.from("service_requests").select("id").neq("status", "Resolved"),
        supabase.from("digitized_records").select("id, title, category, ward, captured_by, created_at").order("created_at", { ascending: false }).limit(2),
      ]);

      setPoints(pointData ?? []);
      setMonthReceipts(monthData ?? []);
      setUnbankedReceipts(unbankedData ?? []);
      const map: Record<string, string> = {};
      (profileData ?? []).forEach((p) => {
        if (p.collection_point_id) map[p.collection_point_id] = p.name;
      });
      setCollectors(map);
      setArrearsTotal((ratepayerData ?? []).reduce((s, r) => s + Number(r.balance), 0));
      setOpenRequests((requestData ?? []).length);
      setDigitized(digitizedData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading dashboard...</div>;
  }

  const today = startOfToday();
  const todayReceipts = monthReceipts.filter((r) => new Date(r.created_at) >= today);
  const revenueToday = todayReceipts.reduce((s, r) => s + Number(r.amount), 0);
  const collectedThisMonth = monthReceipts.reduce((s, r) => s + Number(r.amount), 0);
  const activeCollectors = new Set(todayReceipts.map((r) => r.collector_name)).size;
  const unbankedTotal = unbankedReceipts.reduce((s, r) => s + Number(r.amount), 0);

  const pointWard: Record<string, string> = {};
  const pointName: Record<string, string> = {};
  points.forEach((p) => {
    pointWard[p.id] = p.ward;
    pointName[p.id] = p.name;
  });

  // Trend: daily totals for the current month so far
  const trend: { date: string; collected: number }[] = [];
  const daysSoFar = today.getDate();
  for (let d = 1; d <= daysSoFar; d++) {
    const dayTotal = monthReceipts
      .filter((r) => new Date(r.created_at).getDate() === d)
      .reduce((s, r) => s + Number(r.amount), 0);
    trend.push({ date: String(d), collected: dayTotal });
  }

  // By ward, this month
  const wardTotals: Record<string, number> = {};
  monthReceipts.forEach((r) => {
    const ward = pointWard[r.point_id] ?? "Unknown";
    wardTotals[ward] = (wardTotals[ward] ?? 0) + Number(r.amount);
  });
  const byWard = Object.entries(wardTotals).sort((a, b) => b[1] - a[1]);
  const maxWard = Math.max(1, ...byWard.map(([, v]) => v));

  // Unbanked, grouped by point
  const unbankedByPoint: Record<string, number> = {};
  unbankedReceipts.forEach((r) => {
    unbankedByPoint[r.point_id] = (unbankedByPoint[r.point_id] ?? 0) + Number(r.amount);
  });
  const unbankedPoints = Object.entries(unbankedByPoint);

  const recentReceipts = [...monthReceipts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 2);

  const briefingItems: { tone: StatusTone; text: string }[] = [];
  if (unbankedPoints.length > 0) {
    briefingItems.push({ tone: "warn", text: `$${unbankedTotal.toLocaleString()} uncollected/unbanked across ${unbankedPoints.length} point${unbankedPoints.length !== 1 ? "s" : ""}` });
  }
  if (openRequests > 0) {
    briefingItems.push({ tone: "warn", text: `${openRequests} ward service request${openRequests !== 1 ? "s" : ""} awaiting response` });
  }
  if (arrearsTotal > 0) {
    briefingItems.push({ tone: "neutral", text: `$${arrearsTotal.toLocaleString()} outstanding in ratepayer arrears` });
  }

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[1400px]">
      <div className="hidden lg:block mb-6">
        <div className="font-display text-2xl font-semibold text-ink">{timeGreeting()} 👋</div>
        <div className="text-sm text-dim mt-1">Here's what's happening across Makoni District today.</div>
      </div>

      <div className="lg:hidden">
        <DistrictBriefing items={briefingItems} />
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 mb-5 lg:mb-6">
        <Card className="p-3 lg:p-4">
          <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">${revenueToday.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-dim leading-snug">Revenue today</div>
        </Card>
        <Card className="p-3 lg:p-4">
          <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">{activeCollectors}</div>
          <div className="text-[10px] lg:text-xs text-dim leading-snug">Active collectors today</div>
        </Card>
        <Card tone="warn" className="p-3 lg:p-4">
          <div className="font-display text-lg lg:text-2xl font-semibold text-ink mb-0.5">${unbankedTotal.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-dim leading-snug">Uncollected/unbanked</div>
        </Card>
        <Card tone={openRequests > 0 ? "warn" : "success"} className="p-3 lg:p-4 hidden lg:block">
          <div className="font-display text-2xl font-semibold text-ink mb-0.5">{openRequests}</div>
          <div className="text-xs text-dim leading-snug">Open requests</div>
        </Card>
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-semibold text-ink">Revenue overview</div>
              <div className="text-[11px] text-dim mt-0.5">This month</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-semibold text-ink">${collectedThisMonth.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#E4EAED" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DCE3E8" }} />
                <Line type="monotone" dataKey="collected" stroke="#2FBF95" strokeWidth={2.5} dot={{ r: 3, fill: "#2FBF95" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 col-span-1">
          <div className="text-sm font-semibold text-ink mb-0.5">Collections by ward</div>
          <div className="text-[11px] text-dim mb-4">This month</div>
          {byWard.length === 0 && <div className="text-xs text-dim text-center py-6">No collections recorded yet.</div>}
          <div className="flex flex-col gap-3.5">
            {byWard.map(([ward, total]) => (
              <div key={ward}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink font-medium">{ward}</span>
                  <span className="text-dim">${total.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[#E4EAED] rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(total / maxWard) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-1">
          <DistrictBriefing compact items={briefingItems} />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        <div>
          <SectionHeader title="Unbanked collections" action="Reconcile" onAction={() => onGo("revenue", "reconcile")} />
          <Card className="mb-5 lg:mb-0 overflow-hidden">
            {unbankedPoints.length === 0 && <div className="px-3.5 py-4 text-xs text-dim text-center">Everything is banked. Nice.</div>}
            {unbankedPoints.map(([pointId, total], i) => (
              <div key={pointId} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < unbankedPoints.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={Wallet} tone="warn" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{pointName[pointId] ?? "Unknown point"}</div>
                  <div className="text-[11px] text-dim">{collectors[pointId] ?? "Unassigned"}</div>
                </div>
                <div className="text-sm font-semibold text-warn">${total.toLocaleString()}</div>
              </div>
            ))}
          </Card>
        </div>

        <div className="lg:mt-0">
          <SectionHeader title="Recent receipts" action="View all" onAction={() => onGo("revenue", "collection")} />
          <Card className="mb-5 lg:mb-0 overflow-hidden">
            {recentReceipts.length === 0 && <div className="px-3.5 py-4 text-xs text-dim text-center">No receipts recorded yet.</div>}
            {recentReceipts.map((r, i, arr) => (
              <div key={r.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={ReceiptIcon} tone="success" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{pointName[r.point_id] ?? "Unknown point"}</div>
                  <div className="text-[11px] text-dim">{r.collector_name}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-1">
                  <div className="text-sm font-semibold text-success">+${r.amount}</div>
                  <div className="text-[10.5px] text-faint">{timeAgo(r.created_at)}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionHeader title="Recently digitized" action="View all" onAction={() => onGo("records")} />
          <Card className="overflow-hidden">
            {digitized.length === 0 && <div className="px-3.5 py-4 text-xs text-dim text-center">Nothing digitized yet.</div>}
            {digitized.map((d, i, arr) => (
              <div key={d.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <IconChip icon={FileText} tone="accent" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{d.title}</div>
                  <div className="text-[11px] text-dim">{d.category} · {d.ward}</div>
                </div>
                <div className="text-[10.5px] text-faint flex-shrink-0">{timeAgo(d.created_at)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
