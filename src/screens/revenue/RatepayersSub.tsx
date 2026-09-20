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
}

function RatepayerCard({ r }: { r: RatepayerRow }) {
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
    </Card>
  );
}

export function RatepayersSub() {
  const [ratepayers, setRatepayers] = useState<RatepayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("ratepayers")
      .select("id, name, ward, type, balance, status, last_payment")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError("Couldn't load ratepayer accounts.");
        else setRatepayers(data ?? []);
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
            {arrears.map((r) => <RatepayerCard key={r.id} r={r} />)}
          </div>
        </>
      )}
      <SectionHeader title="Current accounts" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-3">
        {current.map((r) => <RatepayerCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
