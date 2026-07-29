import React, { useState } from "react";
import { Building2, Mail, Lock, Eye, EyeOff, UserCircle } from "lucide-react";
import { ACCOUNTS } from "../lib/accounts";
import { IconChip } from "../components/ui/atoms";
import type { Account } from "../lib/types";

export function LoginScreen({ onLogin }: { onLogin: (account: Account) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function attemptLogin() {
    const found = ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
    if (found) {
      setError("");
      onLogin(found);
    } else {
      setError("Email or password not recognized. Try a demo account below.");
    }
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-chrome mx-auto mb-4 flex items-center justify-center shadow-[0_4px_14px_rgba(5,37,96,0.3)]">
          <Building2 size={23} className="text-accent" strokeWidth={2} />
        </div>
        <div className="text-2xl font-display font-semibold tracking-tight mb-1 text-ink">Dare OS</div>
        <div className="text-sm text-dim">Rural District Council Operating System</div>
      </div>

      <div className="mb-3">
        <label className="text-xs font-semibold text-ink mb-1.5 block">Email</label>
        <div className="relative">
          <Mail size={16} className="text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@mutasa.rdc.gov.zw"
            className="w-full py-3 pl-9 pr-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mb-2.5">
        <label className="text-xs font-semibold text-ink mb-1.5 block">Password</label>
        <div className="relative">
          <Lock size={16} className="text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            className="w-full py-3 pl-9 pr-9 rounded-lg border border-border text-sm outline-none focus:border-accent"
          />
          <button onClick={() => setShowPw(!showPw)} type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1">
            {showPw ? <EyeOff size={16} className="text-faint" /> : <Eye size={16} className="text-faint" />}
          </button>
        </div>
      </div>

      {error && <div className="text-[11.5px] text-danger mb-2.5">{error}</div>}

      <button onClick={attemptLogin} className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold mb-7">
        Sign in
      </button>

      <div className="text-[11px] text-faint text-center mb-3 tracking-wide">DEMO ACCOUNTS — TAP TO SIGN IN</div>
      <div className="flex flex-col gap-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.email}
            onClick={() => onLogin(a)}
            className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl border border-border bg-surface text-left"
          >
            <IconChip icon={UserCircle} tone="accent" size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink">
                {a.name} <span className="font-normal text-dim">· {a.roleLabel}</span>
              </div>
              <div className="text-[10.5px] text-faint">{a.email}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
