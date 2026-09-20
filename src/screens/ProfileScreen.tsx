import React, { useEffect, useState } from "react";
import { UserCircle, LogOut, MapPin, Wallet, Truck } from "lucide-react";
import { Card } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account } from "../lib/types";

export function ProfileScreen({ account, onLogout }: { account: Account; onLogout: () => void }) {
  const [vehicleName, setVehicleName] = useState<string | null>(null);

  useEffect(() => {
    if (account.role === "driver" && account.vehicleId) {
      supabase.from("assets").select("name").eq("id", account.vehicleId).single().then(({ data }) => {
        if (data) setVehicleName(data.name);
      });
    }
  }, [account.role, account.vehicleId]);

  const scope =
    account.role === "collector" && account.collectionPointId
      ? { icon: Wallet, label: "Collection point", value: account.collectionPointId }
      : account.role === "ward_officer" && account.ward
      ? { icon: MapPin, label: "Ward", value: account.ward }
      : account.role === "driver"
      ? { icon: Truck, label: "Vehicle", value: vehicleName ?? "Loading..." }
      : null;

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card className="p-5 mb-4.5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accentSoft mx-auto mb-3.5 flex items-center justify-center">
          <UserCircle size={28} className="text-accent" />
        </div>
        <div className="font-display text-lg font-semibold text-ink mb-0.5">{account.name}</div>
        <div className="text-xs text-dim">{account.roleLabel}</div>
      </Card>

      <Card className="p-3.5 mb-2.5">
        <div className="text-[11px] text-dim mb-1">SIGNED IN AS</div>
        <div className="text-sm text-ink">{account.email}</div>
      </Card>

      {scope && (
        <Card className="p-3.5 mb-4.5 flex items-center gap-2.5">
          <scope.icon size={16} className="text-accent flex-shrink-0" />
          <div>
            <div className="text-[11px] text-dim">{scope.label.toUpperCase()}</div>
            <div className="text-sm text-ink font-medium">{scope.value}</div>
          </div>
        </Card>
      )}

      <button
        onClick={onLogout}
        className="w-full py-3.5 rounded-lg border border-border bg-surface text-danger text-sm font-semibold flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
