import React, { useEffect, useState, useCallback } from "react";
import { Camera, MapPin, Check, ChevronRight, ChevronLeft, Wallet } from "lucide-react";
import { Card, Badge, SectionHeader, IconChip } from "../components/ui/atoms";
import { supabase } from "../lib/supabaseClient";
import type { Account } from "../lib/types";

const FEE_TYPES = ["Market stall", "Terminus fee", "Parking fee", "Other"];

type Step = "idle" | "feeType" | "amount" | "photo" | "review" | "done";

interface PointRow {
  id: string;
  name: string;
  ward: string;
  fee_category: string;
}

interface ReceiptRow {
  id: string;
  fee_type: string;
  amount: number;
  collector_name: string;
  banked: boolean;
  voided: boolean;
  voided_reason: string | null;
  created_at: string;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
}

export function CollectorToday({ account }: { account: Account }) {
  const [point, setPoint] = useState<PointRow | null>(null);
  const [todayReceipts, setTodayReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [step, setStep] = useState<Step>("idle");
  const [feeType, setFeeType] = useState("");
  const [amount, setAmount] = useState("");
  const [photoAttached, setPhotoAttached] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastReceiptNumber, setLastReceiptNumber] = useState("");

  const loadData = useCallback(async () => {
    if (!account.collectionPointId) return;
    setLoadError("");

    const [{ data: pointData, error: pointError }, { data: receiptData, error: receiptError }] = await Promise.all([
      supabase.from("collection_points").select("id, name, ward, fee_category").eq("id", account.collectionPointId).single(),
      supabase
        .from("receipts")
        .select("id, fee_type, amount, collector_name, banked, voided, voided_reason, created_at")
        .eq("point_id", account.collectionPointId)
        .gte("created_at", startOfToday())
        .order("created_at", { ascending: false }),
    ]);

    if (pointError || receiptError) {
      setLoadError("Couldn't load your collection point. Try refreshing.");
    } else {
      setPoint(pointData);
      setTodayReceipts(receiptData ?? []);
    }
    setLoading(false);
  }, [account.collectionPointId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function reset() {
    setStep("idle");
    setFeeType("");
    setAmount("");
    setPhotoAttached(false);
    setSubmitError("");
  }

  async function submit() {
    if (!account.collectionPointId) return;
    setSubmitting(true);
    setSubmitError("");

    const { data, error } = await supabase
      .from("receipts")
      .insert({
        point_id: account.collectionPointId,
        fee_type: feeType,
        amount: Number(amount) || 0,
        collector_name: account.name,
      })
      .select("receipt_number")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setSubmitError("Couldn't save this collection. Check your connection and try again.");
      return;
    }

    setLastReceiptNumber(data.receipt_number);
    await loadData();
    setStep("done");
  }

  async function voidReceipt(id: string) {
    const reason = window.prompt("Why is this collection being voided? (e.g. wrong amount entered)");
    if (!reason) return;
    const { error } = await supabase
      .from("receipts")
      .update({ voided: true, voided_reason: reason, voided_by: account.id, voided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      window.alert("Couldn't void this collection - it may already be banked, which requires a CEO to correct.");
      return;
    }
    await loadData();
  }

  if (loading) {
    return <div className="px-3.5 pt-8 text-sm text-dim text-center">Loading your collection point...</div>;
  }

  if (loadError || !point) {
    return <div className="px-3.5 pt-8 text-sm text-danger text-center">{loadError || "No collection point assigned to your account."}</div>;
  }

  const activeReceipts = todayReceipts.filter((r) => !r.voided);
  const todayTotal = activeReceipts.reduce((s, r) => s + Number(r.amount), 0);
  const allBanked = activeReceipts.length > 0 && activeReceipts.every((r) => r.banked);

  // ---- Guided capture flow ----
  if (step !== "idle") {
    return (
      <div className="px-3.5 pt-4 pb-6">
        {step !== "done" && (
          <button
            onClick={() => setStep(step === "feeType" ? "idle" : step === "amount" ? "feeType" : step === "photo" ? "amount" : "photo")}
            className="flex items-center gap-1 text-dim text-xs mb-4 py-1.5 px-0.5"
          >
            <ChevronLeft size={15} /> Back
          </button>
        )}

        {step === "feeType" && (
          <>
            <div className="text-[11px] text-dim mb-1.5 tracking-wide">STEP 1 OF 3</div>
            <div className="font-display text-xl font-semibold text-ink mb-1">What fee is this?</div>
            <div className="text-xs text-dim mb-6">{point.name}</div>
            <div className="flex flex-col gap-2.5">
              {FEE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setFeeType(t); setStep("amount"); }}
                  className="w-full py-4 px-4 rounded-xl border border-border bg-surface text-left text-sm font-medium text-ink flex items-center justify-between"
                >
                  {t}
                  <ChevronRight size={16} className="text-faint" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "amount" && (
          <>
            <div className="text-[11px] text-dim mb-1.5 tracking-wide">STEP 2 OF 3</div>
            <div className="font-display text-xl font-semibold text-ink mb-1">How much was collected?</div>
            <div className="text-xs text-dim mb-6">{feeType} · {point.name}</div>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-faint font-display">$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full py-4 pl-9 pr-4 rounded-xl border border-border text-2xl font-display font-semibold outline-none focus:border-accent"
              />
            </div>
            <button
              disabled={!amount}
              onClick={() => setStep("photo")}
              className={`w-full py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${amount ? "bg-accent text-white" : "bg-border text-faint"}`}
            >
              Continue <ChevronRight size={16} />
            </button>
          </>
        )}

        {step === "photo" && (
          <>
            <div className="text-[11px] text-dim mb-1.5 tracking-wide">STEP 3 OF 3</div>
            <div className="font-display text-xl font-semibold text-ink mb-1">Attach a photo</div>
            <div className="text-xs text-dim mb-6">Optional, but recommended for the record</div>
            <button
              onClick={() => setPhotoAttached(true)}
              className={`w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 ${photoAttached ? "border-accent bg-accentSoft" : "border-border bg-surface"}`}
            >
              {photoAttached ? <Check size={26} className="text-accent" /> : <Camera size={26} className="text-faint" />}
              <span className={`text-xs font-medium ${photoAttached ? "text-accent" : "text-dim"}`}>
                {photoAttached ? "Photo attached" : "Tap to attach photo"}
              </span>
            </button>
            <Card tone="accent" className="p-3 mb-6 flex items-center gap-2.5">
              <MapPin size={15} className="text-accent flex-shrink-0" />
              <span className="text-[11.5px] text-ink">Location captured automatically — {point.ward}</span>
            </Card>
            <button
              onClick={() => setStep("review")}
              className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              Review <ChevronRight size={16} />
            </button>
          </>
        )}

        {step === "review" && (
          <>
            <div className="font-display text-xl font-semibold text-ink mb-5">Confirm collection</div>
            <Card className="p-4 mb-4">
              {[
                ["Collection point", point.name],
                ["Fee type", feeType],
                ["Amount", `$${amount}`],
                ["Photo", photoAttached ? "Attached" : "Not attached"],
                ["Location", `Captured — ${point.ward}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-dim">{label}</span>
                  <span className="text-xs font-medium text-ink">{val}</span>
                </div>
              ))}
            </Card>
            {submitError && <div className="text-[11.5px] text-danger mb-2.5">{submitError}</div>}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={16} /> {submitting ? "Saving..." : "Submit collection"}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-successSoft mx-auto mb-5 flex items-center justify-center">
              <Check size={30} className="text-success" />
            </div>
            <div className="font-display text-xl font-semibold text-ink mb-1.5">Collection recorded</div>
            <div className="text-sm text-dim mb-1">${amount} · {feeType} · {point.name}</div>
            {lastReceiptNumber && (
              <div className="inline-block px-3 py-1.5 rounded-lg bg-accentSoft text-accent text-xs font-semibold font-mono tracking-wide mb-8">
                Receipt {lastReceiptNumber}
              </div>
            )}
            <button onClick={reset} className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold">
              Record another
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Home view ----
  return (
    <div className="px-3.5 pt-4 pb-6">
      <div className="mb-4">
        <div className="font-display text-lg font-semibold text-ink mb-0.5">{point.name}</div>
        <div className="text-xs text-dim">{point.fee_category} · {point.ward}</div>
      </div>

      <Card tone={allBanked ? "success" : "warn"} className="p-4.5 mb-4 text-center">
        <div className="text-[11px] text-dim mb-1.5">COLLECTED TODAY</div>
        <div className="font-display text-[34px] font-semibold text-ink mb-2.5">${todayTotal}</div>
        <Badge tone={allBanked ? "success" : "warn"}>
          {todayReceipts.length === 0 ? "No collections yet" : allBanked ? "Banked" : "Not yet banked"}
        </Badge>
      </Card>

      <button
        onClick={() => setStep("feeType")}
        className="w-full py-4 rounded-xl bg-accent text-white text-[15px] font-semibold mb-5 flex items-center justify-center gap-2"
      >
        <Wallet size={17} /> New collection
      </button>

      <SectionHeader title="Your receipts today" />
      <Card className="overflow-hidden">
        {todayReceipts.length === 0 && (
          <div className="px-3.5 py-4 text-xs text-dim text-center">No collections recorded yet today.</div>
        )}
        {todayReceipts.map((r, i, arr) => (
          <div key={r.id} className={`flex justify-between items-center px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <div className={r.voided ? "opacity-50" : ""}>
              <div className={`text-sm text-ink ${r.voided ? "line-through" : ""}`}>{r.fee_type}</div>
              <div className="text-[10.5px] text-faint mt-0.5">
                {r.voided ? `Voided — ${r.voided_reason}` : timeAgo(r.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className={`text-sm font-semibold ${r.voided ? "text-faint line-through" : "text-success"}`}>+${r.amount}</div>
              {!r.voided && !r.banked && (
                <button onClick={() => voidReceipt(r.id)} className="text-[10.5px] text-danger underline">
                  Void
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
