import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { fetchAccountForUser } from "../lib/auth";
import type { Account } from "../lib/types";

export function LoginScreen({ onLogin }: { onLogin: (account: Account) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function attemptLogin() {
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      setError("Email or password not recognized.");
      setLoading(false);
      return;
    }

    const account = await fetchAccountForUser(authData.user.id, authData.user.email!);

    if (!account) {
      // Signed in successfully, but there's no matching profiles row - this
      // means the account exists in Auth but hasn't been provisioned with a
      // role/scope yet. Surface this clearly rather than letting the app
      // silently break on the next screen.
      setError("Signed in, but no profile is set up for this account yet. Contact an admin.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(account);
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-chrome mx-auto mb-4 flex items-center justify-center shadow-[0_4px_14px_rgba(5,37,96,0.3)]">
          <img src="/brand-mark.png" alt="" className="w-6 h-6" />
        </div>
        <div className="text-2xl font-display font-semibold tracking-tight mb-1 text-ink">CORA</div>
      </div>

      <div className="mb-3">
        <label className="text-xs font-semibold text-ink mb-1.5 block">Email</label>
        <div className="relative">
          <Mail size={16} className="text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@makoni.rdc.gov.zw"
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) attemptLogin();
            }}
            className="w-full py-3 pl-9 pr-9 rounded-lg border border-border text-sm outline-none focus:border-accent"
          />
          <button onClick={() => setShowPw(!showPw)} type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1">
            {showPw ? <EyeOff size={16} className="text-faint" /> : <Eye size={16} className="text-faint" />}
          </button>
        </div>
      </div>

      {error && <div className="text-[11.5px] text-danger mb-2.5">{error}</div>}

      <button
        onClick={attemptLogin}
        disabled={loading || !email || !password}
        className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
