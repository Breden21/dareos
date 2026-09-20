import React, { useEffect, useState } from "react";
import { Card, Badge, statusTone } from "../../components/ui/atoms";
import { supabase } from "../../lib/supabaseClient";

interface StandRow {
  id: string;
  stand_number: string;
  ward: string;
  buyer_name: string;
  price: number;
  amount_paid: number;
  status: string;
  date_allocated: string;
}

export function StandsSub() {
  const [stands, setStands] = useState<StandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("land_stands")
      .select("id, stand_number, ward, buyer_name, price, amount_paid, status, date_allocated")
      .order("date_allocated", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("Couldn't load land stand records.");
        else setStands(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-sm text-dim text-center pt-8">Loading...</div>;
  if (error) return <div className="text-sm text-danger text-center pt-8">{error}</div>;
  if (stands.length === 0) {
    return (
      <div className="text-sm text-dim text-center pt-8 px-6">
        No land stand records yet. New stands are entered by the Records Clerk as they're registered.
      </div>
    );
  }

  return (
    <div>
      {stands.map((s) => {
        const pct = Math.round((Number(s.amount_paid) / Number(s.price)) * 100);
        const tone = s.status === "Paid up" ? "success" : s.status === "Unpaid" ? "danger" : "warn";
        return (
          <Card key={s.id} tone={tone} className="p-3.5 mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <div className="text-sm font-medium text-ink">{s.buyer_name}</div>
                <div className="text-[11px] text-dim">
                  {s.stand_number} · {s.ward} · allocated {new Date(s.date_allocated).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </div>
            <div className="flex justify-between text-[11.5px] mb-1.5">
              <span className="text-dim">${s.amount_paid} of ${s.price}</span>
              <span className="text-ink font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
