import React from "react";
import { Bell, LogOut, Search } from "lucide-react";
import type { Role, TabKey } from "../../lib/types";

export interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  title: string;
}

export function Header({
  accountLabel,
  title,
  onLogout,
}: {
  accountLabel: string;
  title: string;
  onLogout: () => void;
}) {
  return (
    <header className="lg:hidden sticky top-0 z-10 bg-chrome border-b border-chromeLine px-4 py-3.5 relative">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[11px] text-chromeFaint tracking-wide mb-0.5">{accountLabel}</div>
          <div className="text-xl font-display font-semibold tracking-tight text-chromeInk">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg border border-chromeLine bg-chromeAlt flex items-center justify-center">
            <Bell size={16} className="text-chromeFaint" />
          </button>
          <button onClick={onLogout} className="w-9 h-9 rounded-lg border border-chromeLine bg-chromeAlt flex items-center justify-center">
            <LogOut size={15} className="text-chromeFaint" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Topbar({
  title,
  account,
}: {
  title: string;
  account: { name: string; roleLabel: string };
}) {
  const initials = account.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <header className="hidden lg:flex items-center justify-between border-b border-border bg-surface px-8 py-4 sticky top-0 z-10">
      <div className="font-display text-lg font-semibold text-ink">{title}</div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            placeholder="Search anything..."
            readOnly
            className="w-64 pl-8 pr-3 py-2 rounded-lg border border-border bg-bg text-xs text-dim outline-none"
          />
        </div>
        <button className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center">
          <Bell size={16} className="text-dim" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accentSoft flex items-center justify-center text-accent text-xs font-semibold">
            {initials}
          </div>
          <div>
            <div className="text-xs font-medium text-ink leading-tight">{account.name}</div>
            <div className="text-[10.5px] text-dim leading-tight">{account.roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav className="lg:hidden sticky bottom-0 left-0 right-0 bg-chrome border-t border-chromeLine flex px-0.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] z-20">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-lg ${isActive ? "text-accent" : "text-chromeFaint"}`}
          >
            <Icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />
            <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
