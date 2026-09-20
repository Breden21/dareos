import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Account, StatusTone } from "./types";

export interface NotificationItem {
  tone: StatusTone;
  text: string;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Real, computed-on-the-fly alerts drawn from live data - not a stored,
// markable-as-read notification log (that would be a bigger feature of its
// own: persistence, read/unread state, etc.). Each role sees only what's
// actually relevant to them.
export function useNotifications(account: Account | null) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!account) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const result: NotificationItem[] = [];

      if (account.role === "ceo") {
        const [{ data: unbanked }, { data: requests }, { data: arrears }] = await Promise.all([
          supabase.from("receipts").select("amount, point_id").eq("voided", false).eq("banked", false),
          supabase.from("service_requests").select("id").neq("status", "Resolved"),
          supabase.from("ratepayers").select("balance").eq("status", "Arrears"),
        ]);
        const unbankedTotal = (unbanked ?? []).reduce((s, r) => s + Number(r.amount), 0);
        const unbankedPoints = new Set((unbanked ?? []).map((r) => r.point_id)).size;
        if (unbankedPoints > 0) {
          result.push({ tone: "warn", text: `$${unbankedTotal.toLocaleString()} unbanked across ${unbankedPoints} point${unbankedPoints !== 1 ? "s" : ""}` });
        }
        if ((requests ?? []).length > 0) {
          result.push({ tone: "warn", text: `${requests!.length} service request${requests!.length !== 1 ? "s" : ""} awaiting response` });
        }
        const arrearsTotal = (arrears ?? []).reduce((s, r) => s + Number(r.balance), 0);
        if (arrearsTotal > 0) {
          result.push({ tone: "neutral", text: `$${arrearsTotal.toLocaleString()} outstanding in ratepayer arrears` });
        }
      }

      if (account.role === "collector" && account.collectionPointId) {
        const { data } = await supabase
          .from("receipts")
          .select("amount")
          .eq("point_id", account.collectionPointId)
          .eq("voided", false)
          .eq("banked", false);
        const total = (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
        if (total > 0) {
          result.push({ tone: "warn", text: `$${total.toLocaleString()} of your collections not yet confirmed banked` });
        }
      }

      if (account.role === "ward_officer" && account.ward) {
        const { data } = await supabase.from("service_requests").select("id").eq("ward", account.ward).neq("status", "Resolved");
        if ((data ?? []).length > 0) {
          result.push({ tone: "warn", text: `${data!.length} open service request${data!.length !== 1 ? "s" : ""} in ${account.ward}` });
        }
      }

      if (account.role === "driver" && account.vehicleId) {
        const { data } = await supabase.from("assets").select("condition").eq("id", account.vehicleId).single();
        if (data && data.condition !== "Working") {
          result.push({ tone: "danger", text: `Your vehicle is flagged "${data.condition}"` });
        }
      }

      if (account.role === "records_clerk") {
        const { data: categories } = await supabase.from("digitization_categories").select("name, ward, total_estimated");
        const { data: records } = await supabase.from("digitized_records").select("category, ward");
        (categories ?? []).forEach((c) => {
          const digitized = (records ?? []).filter((r) => r.category === c.name && r.ward === c.ward).length;
          const pct = c.total_estimated > 0 ? Math.round((digitized / c.total_estimated) * 100) : 0;
          if (pct < 50) {
            result.push({ tone: "warn", text: `${c.name} (${c.ward}) is only ${pct}% digitized` });
          }
        });
      }

      if (!cancelled) {
        setItems(result);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [account?.id, account?.role, account?.collectionPointId, account?.ward, account?.vehicleId]);

  return { items, loading };
}
