import React, { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search, Receipt, Landmark, Users, FileText } from "lucide-react";
import type { Role, TabKey } from "../../lib/types";
import type { NotificationItem } from "../../lib/useNotifications";
import { runGlobalSearch, type SearchResult } from "../../lib/globalSearch";

export interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  title: string;
}

function NotificationBell({ items, dark }: { items: NotificationItem[]; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const dotColor = (tone: string) => (tone === "danger" ? "#B33F3F" : tone === "warn" ? "#C08A2E" : "#5B6B7C");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-9 h-9 rounded-lg border flex items-center justify-center ${
          dark ? "border-chromeLine bg-chromeAlt" : "border-border bg-surface"
        }`}
      >
        <Bell size={16} className={dark ? "text-chromeFaint" : "text-dim"} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-72 bg-surface border border-border rounded-xl shadow-lg z-30 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border text-xs font-semibold text-ink">Notifications</div>
          {items.length === 0 && <div className="px-3.5 py-4 text-xs text-dim text-center">Nothing to flag right now.</div>}
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 px-3.5 py-2.5 border-b border-border last:border-0">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor(item.tone) }} />
              <span className="text-[12px] text-ink leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const RESULT_ICON: Record<SearchResult["type"], React.ElementType> = {
  receipt: Receipt,
  stand: Landmark,
  ratepayer: Users,
  record: FileText,
};

export function Header({
  accountLabel,
  title,
  onLogout,
  notifications,
}: {
  accountLabel: string;
  title: string;
  onLogout: () => void;
  notifications: NotificationItem[];
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
          <NotificationBell items={notifications} dark />
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
  notifications,
  onSelectResult,
}: {
  title: string;
  account: { name: string; roleLabel: string };
  notifications: NotificationItem[];
  onSelectResult: (tab: string, sub?: string) => void;
}) {
  const initials = account.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      runGlobalSearch(query).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function selectResult(r: SearchResult) {
    onSelectResult(r.goTab, r.goSub);
    setQuery("");
    setResults(null);
  }

  return (
    <header className="hidden lg:flex items-center justify-between border-b border-border bg-surface px-8 py-4 sticky top-0 z-10">
      <div className="font-display text-lg font-semibold text-ink">{title}</div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={searchRef}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipts, stands, ratepayers, records..."
            className="w-64 pl-8 pr-3 py-2 rounded-lg border border-border bg-bg text-xs text-ink outline-none focus:border-accent"
          />
          {results !== null && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-xl shadow-lg z-30 overflow-hidden">
              {searching && <div className="px-3.5 py-3 text-xs text-dim text-center">Searching...</div>}
              {!searching && results.length === 0 && <div className="px-3.5 py-3 text-xs text-dim text-center">No matches.</div>}
              {!searching &&
                results.map((r, i) => {
                  const Icon = RESULT_ICON[r.type];
                  return (
                    <button
                      key={i}
                      onClick={() => selectResult(r)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border last:border-0 text-left hover:bg-bg"
                    >
                      <Icon size={14} className="text-dim flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-ink truncate">{r.label}</div>
                        <div className="text-[10.5px] text-dim truncate">{r.sublabel}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        <NotificationBell items={notifications} />
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
