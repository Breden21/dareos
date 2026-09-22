import React, { useEffect, useState } from "react";
import { Card, Badge, SectionHeader, statusTone } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";

interface RatepayerRow {
  id: string;
  name: string;
  ward: string;
  type: string;
  balance: number;
  status: string;
  last_payment: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

function RatepayerCard({ r, editorNames }: { r: RatepayerRow; editorNames: Record<string, string> }) {
  const tone = r.status === "Arrears" ? "danger" : "success";
  return (
    <Card tone={tone} className="p-3.5 mb-2">
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="text-sm font-medium text-ink">{r.name}</div>
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      </div>
      <div className="flex justify-between text-[11px] text-dim">
        <span>{r.type} · {r.ward}</span>
        {r.balance > 0 ? (
          <span className="text-danger font-semibold">${r.balance} due</span>
        ) : (
          <span>{r.last_payment ? `Paid ${new Date(r.last_payment).toLocaleDateString([], { day: "numeric", month: "short" })}` : "No payments yet"}</span>
        )}
      </div>
      {r.updated_at && (
        <div className="text-[10.5px] text-warn mt-1">
          Edited by {editorNames[r.updated_by ?? ""] ?? "someone"} · {new Date(r.updated_at).toLocaleDateString([], { day: "numeric", month: "short" })}
        </div>
      )}
    </Card>
  );
}

export function RatepayersSub() {
  const [ratepayers, setRatepayers] = useState<RatepayerRow[]>([]);
  const [editorNames, setEditorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      supabase
        .from("ratepayers")
        .select("id, name, ward, type, balance, status, last_payment, updated_by, updated_at")
        .order("name"),
      supabase.from("profiles").select("id, name"),
    ]).then(([{ data, error }, { data: profileData }]) => {
      if (error) setError("Couldn't load ratepayer accounts.");
      else setRatepayers(data ?? []);
      const map: Record<string, string> = {};
      (profileData ?? []).forEach((p) => { map[p.id] = p.name; });
      setEditorNames(map);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;
  if (error) return <div className="text-sm text-danger text-center pt-8">{error}</div>;
  if (ratepayers.length === 0) {
    return (
      <div className="text-sm text-dim text-center pt-8 px-6">
        No ratepayer accounts yet. New accounts are entered by the Records Clerk as they're registered.
      </div>
    );
  }

  const arrears = ratepayers.filter((r) => r.status === "Arrears");
  const current = ratepayers.filter((r) => r.status === "Current");

  return (
    <div>
      {arrears.length > 0 && (
        <>
          <SectionHeader title={`In arrears (${arrears.length})`} />
          <div className="lg:grid lg:grid-cols-2 lg:gap-3">
            {arrears.map((r) => <RatepayerCard key={r.id} r={r} editorNames={editorNames} />)}
          </div>
        </>
      )}
      <SectionHeader title="Current accounts" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        {current.map((r) => <RatepayerCard key={r.id} r={r} editorNames={editorNames} />)}
      </div>
    </div>
  );
}
