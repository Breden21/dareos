import React, { useState } from "react";
import { Camera, FolderOpen, FileText, Check } from "lucide-react";
import { Card, SectionHeader, IconChip } from "../components/ui/atoms";
import { digitizationCategories, digitizedRecords } from "../lib/mockData";
import type { StatusTone } from "../lib/types";

function progressTone(pct: number): StatusTone {
  return pct >= 90 ? "success" : pct >= 50 ? "warn" : "danger";
}

export function RecordsScreen({ showCaptureAction = true }: { showCaptureAction?: boolean }) {
  const [captured, setCaptured] = useState(false);
  const totalDigitized = digitizationCategories.reduce((s, c) => s + c.digitized, 0);
  const totalAll = digitizationCategories.reduce((s, c) => s + c.total, 0);
  const overallPct = Math.round((totalDigitized / totalAll) * 100);

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card className="p-6 mb-4.5 bg-gradient-to-br from-chrome to-chromeAlt border-0">
        <div className="text-[11.5px] text-chromeFaint mb-2 tracking-wide">ARCHIVE DIGITIZED</div>
        <div className="font-display text-[32px] font-semibold text-white mb-2.5">{overallPct}%</div>
        <div className="h-[7px] bg-white/15 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-accent rounded-full" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="text-[11.5px] text-chromeFaint">
          {totalDigitized.toLocaleString()} of {totalAll.toLocaleString()} records digitized
        </div>
      </Card>

      {showCaptureAction && (
        <button
          onClick={() => setCaptured(true)}
          className={`w-full py-3.5 rounded-lg text-sm font-semibold mb-5 flex items-center justify-center gap-1.5 ${
            captured ? "bg-successSoft text-success" : "bg-accent text-white"
          }`}
        >
          {captured ? <Check size={16} /> : <Camera size={16} />}
          {captured ? "Record captured" : "Digitize a record"}
        </button>
      )}

      <SectionHeader title="By category" />
      {digitizationCategories.map((c) => {
        const pct = Math.round((c.digitized / c.total) * 100);
        const backlog = c.total - c.digitized;
        const tone = progressTone(pct);
        return (
          <Card key={c.name} tone={tone} className="p-3.5 mb-2">
            <div className="flex items-center gap-2.5 mb-2.5">
              <IconChip icon={FolderOpen} tone={tone} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{c.name}</div>
                <div className="text-[11px] text-dim">{c.ward} · {backlog} remaining</div>
              </div>
              <div className="font-display text-base font-semibold text-ink">{pct}%</div>
            </div>
            <div className="h-[5px] bg-[#E4EAED] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: tone === "success" ? "#1F8A6F" : tone === "warn" ? "#C08A2E" : "#B33F3F" }}
              />
            </div>
          </Card>
        );
      })}

      <div className="mt-4.5">
        <SectionHeader title="Recently captured" />
        <Card className="overflow-hidden">
          {digitizedRecords.map((d, i, arr) => (
            <div key={d.id} className={`flex items-center gap-2.5 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
              <IconChip icon={FileText} tone="accent" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{d.title}</div>
                <div className="text-[11px] text-dim">{d.category} · {d.ward} · {d.capturedBy}</div>
              </div>
              <div className="text-[10.5px] text-faint flex-shrink-0">{d.time}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

