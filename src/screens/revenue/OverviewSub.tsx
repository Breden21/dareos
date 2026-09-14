import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, SectionHeader } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";

const MONTHS_BACK = 6;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString([], { month: "short" });
}

interface ReceiptRow {
  fee_type: string;
  amount: number;
  created_at: string;
}

interface LevyRow {
  name: string;
  collected: number;
  delta: number | null; // null = no data last month to compare against
}

export function OverviewSub() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const earliest = new Date();
    earliest.setDate(1);
    earliest.setHours(0, 0, 0, 0);
    earliest.setMonth(earliest.getMonth() - (MONTHS_BACK - 1));

    supabase
      .from("receipts")
      .select("fee_type, amount, created_at")
      .eq("voided", false)
      .gte("created_at", earliest.toISOString())
      .then(({ data }) => {
        setReceipts(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;

  // Build the last N months' totals, oldest first
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: monthKey(d), label: monthLabel(d), total: 0 });
  }
  receipts.forEach((r) => {
    const k = monthKey(new Date(r.created_at));
    const bucket = months.find((m) => m.key === k);
    if (bucket) bucket.total += Number(r.amount);
  });

  const thisMonthBucket = months[months.length - 1];
  const lastMonthBucket = months[months.length - 2];
  const overallDelta =
    lastMonthBucket.total > 0
      ? Math.round(((thisMonthBucket.total - lastMonthBucket.total) / lastMonthBucket.total) * 100)
      : null;

  const thisMonth = receipts.filter((r) => monthKey(new Date(r.created_at)) === thisMonthBucket.key);
  const lastMonth = receipts.filter((r) => monthKey(new Date(r.created_at)) === lastMonthBucket.key);

  const feeTypes = Array.from(new Set([...thisMonth, ...lastMonth].map((r) => r.fee_type)));
  const levyTypes: LevyRow[] = feeTypes
    .map((name) => {
      const collected = thisMonth.filter((r) => r.fee_type === name).reduce((s, r) => s + Number(r.amount), 0);
      const prevCollected = lastMonth.filter((r) => r.fee_type === name).reduce((s, r) => s + Number(r.amount), 0);
      const delta = prevCollected > 0 ? Math.round(((collected - prevCollected) / prevCollected) * 100) : null;
      return { name, collected, delta };
    })
    .sort((a, b) => b.collected - a.collected);

  return (
    <div>
      <Card className="p-5 pb-5.5 mb-4.5 text-center bg-gradient-to-br from-chrome to-chromeAlt border-0">
        <div className="text-[11px] text-chromeFaint mb-1.5 tracking-wide">COLLECTED — {thisMonthBucket.label.toUpperCase()}</div>
        <div className="font-display text-4xl font-semibold text-white mb-2">${thisMonthBucket.total.toLocaleString()}</div>
        <div className={`inline-flex items-center gap-1 text-xs font-medium ${overallDelta === null ? "text-chromeFaint" : overallDelta >= 0 ? "text-accent" : "text-[#F5A9A0]"}`}>
          {overallDelta === null ? (
            "No data last month to compare"
          ) : (
            <>
              {overallDelta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(overallDelta)}% vs {lastMonthBucket.label}
            </>
          )}
        </div>
      </Card>

      <SectionHeader title="Month on month" />
      <Card className="p-4 mb-4.5">
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#E4EAED" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Collected"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DCE3E8" }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#2FBF95" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionHeader title="By levy type — this month" />
      {levyTypes.length === 0 && <div className="text-xs text-dim text-center py-4">No collections recorded yet.</div>}
      {levyTypes.map((l) => (
        <Card key={l.name} tone={l.delta === null || l.delta >= 0 ? "success" : "danger"} className="p-3.5 mb-2 flex justify-between items-center">
          <div>
            <div className="text-sm text-ink font-medium">{l.name}</div>
            <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${l.delta === null ? "text-dim" : l.delta >= 0 ? "text-success" : "text-danger"}`}>
              {l.delta === null ? (
                "No data last month"
              ) : (
                <>
                  {l.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(l.delta)}% vs last month
                </>
              )}
            </div>
          </div>
          <div className="font-display text-lg font-semibold text-ink">${l.collected.toLocaleString()}</div>
        </Card>
      ))}
    </div>
  );
}
