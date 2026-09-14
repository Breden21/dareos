import React, { useEffect, useState } from "react";
import { Fuel, Radio, Plus, MapPin } from "lucide-react";
import { Card, Badge, SectionHeader, statusTone } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";

interface VehicleRow {
  id: string;
  name: string;
  ward: string;
  condition: string;
  fuel_pct: number;
  odometer_km: number;
  current_task: string | null;
  assigned_driver: string | null;
  last_ping: string | null;
  last_lat: number | null;
  last_lng: number | null;
}
interface StaffRow {
  id: string;
  department: string;
  filled: number;
  establishment: number;
}
interface MinutesRow {
  id: string;
  committee: string;
  meeting_date: string;
  resolutions: string[];
}

const CONDITIONS = ["Working", "Needs repair", "Poor"];

function FleetCard({ v }: { v: VehicleRow }) {
  const fuelColor = v.fuel_pct < 30 ? "text-danger" : v.fuel_pct < 55 ? "text-warn" : "text-success";
  return (
    <Card tone={statusTone(v.condition)} className="p-3.5 mb-2">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold text-ink">{v.name}</div>
          <div className="text-[11px] text-dim">{v.ward}</div>
        </div>
        <Badge tone={statusTone(v.condition)}>{v.condition}</Badge>
      </div>
      <div className="text-xs text-ink mb-2">{v.current_task || (v.assigned_driver ? `Assigned to ${v.assigned_driver}` : "No driver assigned")}</div>
      <div className="flex justify-between text-[11px] text-dim border-t border-border pt-2">
        <span className={`flex items-center gap-1 ${fuelColor}`}><Fuel size={11} />{v.fuel_pct}%</span>
        <span>{v.odometer_km.toLocaleString()} km</span>
        {v.last_lat && v.last_lng ? (
          <a
            href={`https://www.google.com/maps?q=${v.last_lat},${v.last_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-accent underline"
          >
            <MapPin size={11} /> View on map
          </a>
        ) : (
          <span className="flex items-center gap-1">
            <Radio size={11} />
            {v.last_ping ? new Date(v.last_ping).toLocaleDateString([], { day: "numeric", month: "short" }) : "No activity"}
          </span>
        )}
      </div>
    </Card>
  );
}

export function MoreScreen() {
  const [fleet, setFleet] = useState<VehicleRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [minutes, setMinutes] = useState<MinutesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vSubmitting, setVSubmitting] = useState(false);
  const [vError, setVError] = useState("");
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState("");
  const [vWard, setVWard] = useState("");
  const [vCondition, setVCondition] = useState(CONDITIONS[0]);
  const [vFuel, setVFuel] = useState("100");
  const [vOdometer, setVOdometer] = useState("0");
  const [vDriver, setVDriver] = useState("");

  const [addingMinutes, setAddingMinutes] = useState(false);
  const [mSubmitting, setMSubmitting] = useState(false);
  const [mError, setMError] = useState("");
  const [mCommittee, setMCommittee] = useState("");
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));
  const [mResolutions, setMResolutions] = useState("");

  async function load() {
    const [{ data: assetData }, { data: staffData }, { data: minutesData }] = await Promise.all([
      supabase.from("assets").select("id, name, ward, condition, vehicle_details(fuel_pct, odometer_km, current_task, assigned_driver, last_ping, last_lat, last_lng)").eq("category", "vehicle"),
      supabase.from("staff_establishment").select("id, department, filled, establishment"),
      supabase.from("council_minutes").select("id, committee, meeting_date, resolutions").order("meeting_date", { ascending: false }),
    ]);

    const vehicles: VehicleRow[] = (assetData ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      ward: a.ward,
      condition: a.condition,
      fuel_pct: a.vehicle_details?.fuel_pct ?? 0,
      odometer_km: a.vehicle_details?.odometer_km ?? 0,
      current_task: a.vehicle_details?.current_task ?? null,
      assigned_driver: a.vehicle_details?.assigned_driver ?? null,
      last_ping: a.vehicle_details?.last_ping ?? null,
      last_lat: a.vehicle_details?.last_lat ?? null,
      last_lng: a.vehicle_details?.last_lng ?? null,
    }));

    setFleet(vehicles);
    setStaff(staffData ?? []);
    setMinutes(minutesData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitVehicle() {
    setVSubmitting(true);
    setVError("");
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({ name: vName, asset_type: vType, ward: vWard || null, condition: vCondition, category: "vehicle" })
      .select("id")
      .single();

    if (assetError || !asset) {
      setVSubmitting(false);
      setVError("Couldn't save this vehicle. Check the details and try again.");
      return;
    }

    const { error: detailError } = await supabase.from("vehicle_details").insert({
      asset_id: asset.id,
      fuel_pct: Number(vFuel) || 0,
      odometer_km: Number(vOdometer) || 0,
      assigned_driver: vDriver || null,
    });

    setVSubmitting(false);
    if (detailError) {
      setVError("Vehicle record created, but couldn't save its fuel/odometer details.");
      return;
    }

    setVName(""); setVType(""); setVWard(""); setVCondition(CONDITIONS[0]); setVFuel("100"); setVOdometer("0"); setVDriver("");
    setAddingVehicle(false);
    await load();
  }

  async function submitMinutes() {
    setMSubmitting(true);
    setMError("");
    const resolutionList = mResolutions.split("\n").map((r) => r.trim()).filter(Boolean);
    const { error } = await supabase.from("council_minutes").insert({
      committee: mCommittee,
      meeting_date: mDate,
      resolutions: resolutionList,
    });
    setMSubmitting(false);
    if (error) {
      setMError("Couldn't save these minutes. Check the details and try again.");
      return;
    }
    setMCommittee(""); setMDate(new Date().toISOString().slice(0, 10)); setMResolutions("");
    setAddingMinutes(false);
    await load();
  }

  if (loading) return <div className="px-3.5 lg:px-8 pt-8 text-sm text-dim text-center">Loading...</div>;

  const needsAttention = fleet.filter((v) => v.condition !== "Working");
  const rest = fleet.filter((v) => v.condition === "Working");

  return (
    <div className="px-3.5 lg:px-8 pt-4 lg:pt-7 pb-6 lg:pb-10 lg:max-w-[1100px]">
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionHeader title="Fleet" />

          {!addingVehicle && (
            <button
              onClick={() => setAddingVehicle(true)}
              className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Add a vehicle
            </button>
          )}

          {addingVehicle && (
            <Card className="p-4 mb-4">
              <div className="text-sm font-semibold text-ink mb-3">New vehicle</div>
              <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Name (e.g. Toyota Hilux - ABC 1234)" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <input value={vType} onChange={(e) => setVType(e.target.value)} placeholder="Type (e.g. Pickup truck)" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
                <input value={vWard} onChange={(e) => setVWard(e.target.value)} placeholder="Home ward (optional)" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
              </div>
              <select value={vCondition} onChange={(e) => setVCondition(e.target.value)} className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <input value={vFuel} onChange={(e) => setVFuel(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Fuel %" inputMode="numeric" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
                <input value={vOdometer} onChange={(e) => setVOdometer(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Odometer (km)" inputMode="numeric" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
              </div>
              <input value={vDriver} onChange={(e) => setVDriver(e.target.value)} placeholder="Assigned driver name (optional)" className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-2.5" />
              <div className="text-[10.5px] text-dim mb-4 leading-relaxed">
                Note: this labels the vehicle with a driver's name for display only. Linking it to that driver's actual
                login (so they see it as "their" vehicle) is a separate step, still done via Supabase for now.
              </div>
              {vError && <div className="text-[11.5px] text-danger mb-2.5">{vError}</div>}
              <div className="flex gap-2">
                <button onClick={() => setAddingVehicle(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
                <button
                  onClick={submitVehicle}
                  disabled={!vName || !vType || vSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
                >
                  {vSubmitting ? "Saving..." : "Save vehicle"}
                </button>
              </div>
            </Card>
          )}

          {fleet.length === 0 && <div className="text-xs text-dim text-center py-6">No vehicles recorded yet.</div>}
          {needsAttention.map((v) => <FleetCard key={v.id} v={v} />)}
          {rest.map((v) => <FleetCard key={v.id} v={v} />)}
        </div>

        <div>
          <div className="mt-4.5 lg:mt-0">
            <SectionHeader title="Establishment" />
            {staff.length === 0 && <div className="text-xs text-dim text-center py-4">No staffing data recorded yet.</div>}
            {staff.map((d) => {
              const pct = Math.round((d.filled / d.establishment) * 100);
              const gap = d.establishment - d.filled;
              return (
                <Card key={d.id} className="p-3.5 mb-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink font-medium">{d.department}</span>
                    <span className="text-dim">
                      {d.filled}/{d.establishment}
                      {gap > 0 && <span className="text-danger"> · {gap} vacant</span>}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#E4EAED] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#1F8A6F" : "#C08A2E" }} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-4.5">
            <SectionHeader title="Council resolutions" />

            {!addingMinutes && (
              <button
                onClick={() => setAddingMinutes(true)}
                className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold mb-4 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Add meeting minutes
              </button>
            )}

            {addingMinutes && (
              <Card className="p-4 mb-4">
                <div className="text-sm font-semibold text-ink mb-3">New council minutes</div>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <input value={mCommittee} onChange={(e) => setMCommittee(e.target.value)} placeholder="Committee" className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
                  <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent" />
                </div>
                <label className="text-[11px] font-semibold text-ink mb-1 block">Resolutions (one per line)</label>
                <textarea
                  value={mResolutions}
                  onChange={(e) => setMResolutions(e.target.value)}
                  rows={4}
                  placeholder={"Approved Q3 budget variance report\nDirected audit of Ward 7 collections"}
                  className="w-full py-2.5 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent mb-4"
                />
                {mError && <div className="text-[11.5px] text-danger mb-2.5">{mError}</div>}
                <div className="flex gap-2">
                  <button onClick={() => setAddingMinutes(false)} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-ink">Cancel</button>
                  <button
                    onClick={submitMinutes}
                    disabled={!mCommittee || !mResolutions.trim() || mSubmitting}
                    className="flex-1 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {mSubmitting ? "Saving..." : "Save minutes"}
                  </button>
                </div>
              </Card>
            )}

            {minutes.length === 0 && <div className="text-xs text-dim text-center py-4">No council minutes recorded yet.</div>}
            {minutes.map((m) => (
              <Card key={m.id} className="p-3.5 mb-2 border-l-[3px] border-l-accent">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-semibold text-ink">{m.committee}</span>
                  <span className="text-[11px] text-faint">{new Date(m.meeting_date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <ul className="pl-4 m-0 list-disc">
                  {m.resolutions.map((r, i) => (
                    <li key={i} className="text-xs text-dim leading-relaxed mb-0.5">{r}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
