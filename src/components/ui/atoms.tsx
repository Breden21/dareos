import React from "react";
import { ChevronRight, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import type { StatusTone } from "../../lib/types";

const toneMap: Record<StatusTone, [string, string]> = {
  success: ["#1F8A6F", "#E6F5F0"],
  warn: ["#C08A2E", "#FAF1DC"],
  danger: ["#B33F3F", "#F8EAEA"],
  accent: ["#2FBF95", "#E1F7EF"],
  neutral: ["#5B6B7C", "#E7ECEF"],
};

export function Delta({ value, up, light }: { value: number | null; up?: boolean; light?: boolean }) {
  if (value == null) return null;
  if (light) {
    const hex = up ? "#6EE7C4" : "#F5A9A0";
    return (
      <span style={{ color: hex }} className="inline-flex items-center gap-0.5 text-xs font-semibold">
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {value}%
      </span>
    );
  }
  const cls = up ? "text-success" : "text-danger";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${cls}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {value}%
    </span>
  );
}

export function Card({
  children,
  className = "",
  onClick,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tone?: StatusTone;
}) {
  const style: React.CSSProperties = tone
    ? { background: toneMap[tone][1], border: `1px solid ${toneMap[tone][0]}30` }
    : {};
  return (
    <div
      onClick={onClick}
      style={style}
      className={`${tone ? "" : "bg-surface border border-border"} rounded-2xl shadow-[0_1px_2px_rgba(16,26,43,0.05)] ${onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: string; tone?: StatusTone }) {
  const [fg, bg] = toneMap[tone];
  return (
    <span
      style={{ color: fg, background: bg }}
      className="text-[10.5px] font-semibold tracking-wide px-2 py-1 rounded-full whitespace-nowrap"
    >
      {children.toUpperCase()}
    </span>
  );
}

export function IconChip({ icon: Icon, tone = "accent", size = 34 }: { icon: React.ElementType; tone?: StatusTone; size?: number }) {
  const [fg, bg] = toneMap[tone];
  return (
    <div
      style={{ width: size, height: size, borderRadius: size * 0.32, background: bg }}
      className="flex items-center justify-center flex-shrink-0"
    >
      <Icon size={size * 0.46} color={fg} strokeWidth={2.1} />
    </div>
  );
}

export function statusTone(s: string): StatusTone {
  const map: Record<string, StatusTone> = {
    "On route": "success", Idle: "neutral", "Refuel needed": "warn", Maintenance: "danger", Assigned: "neutral",
    Working: "success", "Needs repair": "warn", Poor: "danger",
    Open: "danger", "In progress": "warn", Resolved: "success",
    Current: "success", Arrears: "danger",
    "Paid up": "success", Instalments: "warn", Unpaid: "danger",
  };
  return map[s] ?? "neutral";
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex justify-between items-center mb-2.5 px-0.5">
      <div className="text-sm font-semibold text-ink">{title}</div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-0.5 text-xs text-accent font-medium">
          {action} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

export function BackRow({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button onClick={onBack} className="flex items-center gap-1 text-dim text-xs mb-3.5 py-1.5 px-0.5">
      <ChevronLeft size={15} /> {label}
    </button>
  );
}
