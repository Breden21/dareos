import React, { useState } from "react";
import { Camera, MapPin, Check, ChevronRight, ChevronLeft, Wallet } from "lucide-react";
import { Card, Badge, SectionHeader, IconChip } from "../components/ui/atoms";
import { collectionPoints, recentReceipts } from "../lib/mockData";
import type { Account, Receipt } from "../lib/types";

const FEE_TYPES = ["Market stall", "Terminus fee", "Parking fee", "Other"];

type Step = "idle" | "feeType" | "amount" | "photo" | "review" | "done";

export function CollectorToday({ account }: { account: Account }) {
  const point = collectionPoints.find((p) => p.id === account.collectionPointId)!;
  const [myReceipts, setMyReceipts] = useState<Receipt[]>(
    recentReceipts.filter((r) => r.collector === account.name && r.time !== "yesterday")
  );

  const [step, setStep] = useState<Step>("idle");
  const [feeType, setFeeType] = useState("");
  const [amount, setAmount] = useState("");
  const [photoAttached, setPhotoAttached] = useState(false);

  function reset() {
    setStep("idle");
    setFeeType("");
    setAmount("");
    setPhotoAttached(false);
  }

  function submit() {
    const newReceipt: Receipt = {
      id: `RCT-${Math.floor(9000 + Math.random() * 900)}`,
      payer: feeType || "Collection",
      point: point.name,
      amount: Number(amount) || 0,
      collector: account.name,
      time: "just now",
    };
    setMyReceipts([newReceipt, ...myReceipts]);
    setStep("done");
  }

  const todayTotal = point.todayTotal + myReceipts.filter((r) => r.time === "just now").reduce((s, r) => s + r.amount, 0);

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
            <Card className="p-4 mb-6">
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
            <button onClick={submit} className="w-full py-3.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2">
              <Check size={16} /> Submit collection
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-successSoft mx-auto mb-5 flex items-center justify-center">
              <Check size={30} className="text-success" />
            </div>
            <div className="font-display text-xl font-semibold text-ink mb-1.5">Collection recorded</div>
            <div className="text-sm text-dim mb-8">${amount} · {feeType} · {point.name}</div>
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
        <div className="text-xs text-dim">{point.type} · {point.ward}</div>
      </div>

      <Card tone={point.banked ? "success" : "warn"} className="p-4.5 mb-4 text-center">
        <div className="text-[11px] text-dim mb-1.5">COLLECTED TODAY</div>
        <div className="font-display text-[34px] font-semibold text-ink mb-2.5">${todayTotal}</div>
        <Badge tone={point.banked ? "success" : "warn"}>{point.banked ? "Banked" : "Not yet banked"}</Badge>
      </Card>

      <button
        onClick={() => setStep("feeType")}
        className="w-full py-4 rounded-xl bg-accent text-white text-[15px] font-semibold mb-5 flex items-center justify-center gap-2"
      >
        <Wallet size={17} /> New collection
      </button>

      <SectionHeader title="Your receipts today" />
      <Card className="overflow-hidden">
        {myReceipts.map((r, i, arr) => (
          <div key={r.id} className={`flex justify-between items-center px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <div>
              <div className="text-sm text-ink">{r.payer}</div>
              <div className="text-[10.5px] text-faint mt-0.5">{r.id} · {r.time}</div>
            </div>
            <div className="text-sm font-semibold text-success">+${r.amount}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
