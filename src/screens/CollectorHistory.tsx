import React from "react";
import { ClipboardList } from "lucide-react";
import { Card, SectionHeader, IconChip } from "../components/ui/atoms";
import { recentReceipts } from "../lib/mockData";
import type { Account } from "../lib/types";

export function CollectorHistory({ account }: { account: Account }) {
  const myReceipts = recentReceipts.filter((r) => r.collector === account.name);
  const total = myReceipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card tone="accent" className="p-4 mb-4.5 flex justify-between items-center">
        <div>
          <div className="text-[11px] text-dim">TOTAL RECEIPTED</div>
          <div className="font-display text-xl font-semibold text-ink">${total}</div>
        </div>
        <IconChip icon={ClipboardList} tone="accent" />
      </Card>
      <SectionHeader title="All receipts" />
      <Card className="overflow-hidden">
        {myReceipts.map((r, i, arr) => (
          <div key={r.id} className={`flex justify-between items-center px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <div>
              <div className="text-sm text-ink">{r.payer}</div>
              <div className="text-[10.5px] text-faint mt-0.5">{r.id} · {r.time}</div>
            </div>
            <div className="text-sm font-semibold text-success">+${r.amount}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
