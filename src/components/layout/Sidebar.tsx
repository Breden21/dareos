import React from "react";
import { ChevronDown } from "lucide-react";
import type { TabDef } from "./Shell";
import type { Account, TabKey } from "../../lib/types";

export function Sidebar({
  groups,
  active,
  onChange,
  account,
  onLogout,
}: {
  groups: { label: string; tabs: TabDef[] }[];
  active: TabKey;
  onChange: (t: TabKey) => void;
  account: Account;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 bg-chrome min-h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 border-b border-chromeLine">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <img src="/brand-mark.png" alt="" className="w=8 h=8 flex-shrink-0" />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold text-chromeInk leading-tight">Dare OS</div>
            <div className="text-[10.5px] text-chromeFaint">Mutasa RDC</div>
          </div>
        </div>
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-chromeLine bg-chromeAlt text-xs text-chromeInk">
          Mutasa RDC
          <ChevronDown size={14} className="text-chromeFaint" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="text-[10px] font-semibold tracking-wider text-chromeFaint px-2.5 mb-1.5">
              {group.label.toUpperCase()}
            </div>
            {group.tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onChange(t.key)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 ${
                    isActive ? "bg-accent/15 text-accent font-medium" : "text-chromeFaint hover:text-chromeInk"
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.3 : 1.9} />
                  {t.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-chromeLine">
        <div className="flex items-center gap-2.5 px-2.5">
          <div className="w-8 h-8 rounded-full bg-accentSoft flex items-center justify-center flex-shrink-0 text-accent text-xs font-semibold">
            {account.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-chromeInk truncate">{account.name}</div>
            <div className="text-[10.5px] text-chromeFaint truncate">{account.roleLabel}</div>
          </div>
          <button onClick={onLogout} className="text-[10.5px] text-chromeFaint hover:text-chromeInk flex-shrink-0">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
