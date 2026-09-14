import React, { useEffect, useState } from "react";
import { Fuel, Check, Radio } from "lucide-react";
import { Card, Badge, SectionHeader, statusTone } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account } from "../lib/types";

interface VehicleData {
  name: string;
  ward: string;
  condition: string;
  fuel_pct: number;
  odometer_km: number;
  current_task: string | null;
  last_ping: string | null;
  last_lat: number | null;
  last_lng: number | null;
}

export function DriverHome({ account }: { account: Account }) {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fuel, setFuel] = useState("");
  const [odometer, setOdometer] = useState("");

  async function load() {
    if (!account.vehicleId) return;
    const { data: assetData } = await supabase.from("assets").select("name, ward, condition").eq("id", account.vehicleId).single();
    const { data: detailData } = await supabase
      .from("vehicle_details")
      .select("fuel_pct, odometer_km, current_task, last_ping, last_lat, last_lng")
      .eq("asset_id", account.vehicleId)
      .single();

    if (assetData && detailData) {
      setVehicle({ ...assetData, ...detailData });
      setFuel(String(detailData.fuel_pct ?? ""));
      setOdometer(String(detailData.odometer_km ?? ""));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Capture real GPS coordinates via the browser's Geolocation API - this
    // will prompt for location permission the first time. Falls back
    // gracefully (just updates last_ping) if permission is denied or
    // geolocation isn't available.
    if (account.vehicleId) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            supabase
              .from("vehicle_details")
              .update({
                last_ping: new Date().toISOString(),
                last_lat: pos.coords.latitude,
                last_lng: pos.coords.longitude,
              })
              .eq("asset_id", account.vehicleId!);
          },
          () => {
            // Permission denied or unavailable - still record presence.
            supabase.from("vehicle_details").update({ last_ping: new Date().toISOString() }).eq("asset_id", account.vehicleId!);
          },
          { timeout: 8000 }
        );
      } else {
        supabase.from("vehicle_details").update({ last_ping: new Date().toISOString() }).eq("asset_id", account.vehicleId);
      }
    }
  }, [account.vehicleId]);

  async function saveStatus() {
    if (!account.vehicleId) return;
    await supabase
      .from("vehicle_details")
      .update({ fuel_pct: Number(fuel) || 0, odometer_km: Number(odometer) || 0, last_ping: new Date().toISOString() })
      .eq("asset_id", account.vehicleId);
    setEditing(false);
    await load();
  }

  async function completeTask() {
    if (!account.vehicleId) return;
    await supabase.from("vehicle_details").update({ current_task: null }).eq("asset_id", account.vehicleId);
    await load();
  }

  if (loading) return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading...</div>;
  if (!vehicle) return <div className="px-3.5 pt-8 text-sm text-danger text-center">No vehicle assigned to your account.</div>;

  const fuelColor = vehicle.fuel_pct < 30 ? "text-danger" : vehicle.fuel_pct < 55 ? "text-warn" : "text-success";
  const fuelHex = vehicle.fuel_pct < 30 ? "#B33F3F" : vehicle.fuel_pct < 55 ? "#C08A2E" : "#1F8A6F";

  return (
    <div className="px-3.5 pt-4 pb-6">
      <Card tone={statusTone(vehicle.condition)} className="p-5 mb-6">
        <div className="flex justify-between items-start mb-3.5">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{vehicle.name}</div>
            <div className="text-[11.5px] text-dim mt-0.5">{vehicle.ward}</div>
          </div>
          <Badge tone={statusTone(vehicle.condition)}>{vehicle.condition}</Badge>
        </div>

        {!editing ? (
          <>
            <div className={`flex items-center gap-1 text-xs font-semibold mb-1.5 ${fuelColor}`}>
              <Fuel size={14} /> {vehicle.fuel_pct}% fuel
            </div>
            <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden mb-3.5">
              <div className="h-full rounded-full" style={{ width: `${vehicle.fuel_pct}%`, background: fuelHex }} />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[11px] text-dim">{vehicle.odometer_km.toLocaleString()} km on the clock</div>
              <button onClick={() => setEditing(true)} className="text-[11px] text-accent font-semibold underline">
                Update
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="text-[11px] font-semibold text-ink mb-1 block">Fuel %</label>
            <input
              value={fuel}
              onChange={(e) => setFuel(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="w-full py-2 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5"
            />
            <label className="text-[11px] font-semibold text-ink mb-1 block">Odometer (km)</label>
            <input
              value={odometer}
              onChange={(e) => setOdometer(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="w-full py-2 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-ink">
                Cancel
              </button>
              <button onClick={saveStatus} className="flex-1 py-2 rounded-lg bg-accent text-white text-xs font-semibold">
                Save
              </button>
            </div>
          </>
        )}
      </Card>

      <SectionHeader title="Current task" />
      <Card className="p-4 mb-4">
        <div className={`text-sm text-ink leading-relaxed ${vehicle.current_task ? "mb-3.5" : ""}`}>{vehicle.current_task || "No task assigned"}</div>
        {vehicle.current_task && (
          <button
            onClick={completeTask}
            className="w-full py-3 rounded-lg bg-accent text-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> Mark task complete
          </button>
        )}
      </Card>

      <SectionHeader title="Last known location" />
      <Card className="p-3.5 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Radio size={16} className="text-dim" />
          <span className="text-xs text-ink">
            {vehicle.last_ping ? `Last active ${new Date(vehicle.last_ping).toLocaleString([], { hour: "numeric", minute: "2-digit" })}` : "No activity recorded yet"}
          </span>
        </div>
        {vehicle.last_lat && vehicle.last_lng && (
          <a
            href={`https://www.google.com/maps?q=${vehicle.last_lat},${vehicle.last_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-accent font-semibold underline flex-shrink-0"
          >
            View on map
          </a>
        )}
      </Card>
    </div>
  );
}
