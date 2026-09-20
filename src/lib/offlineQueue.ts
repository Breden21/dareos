import { supabase } from "./supabaseClient";

export interface QueuedReceipt {
  localId: string;
  point_id: string;
  fee_type: string;
  amount: number;
  collector_name: string;
  queued_at: string;
}

const STORAGE_KEY = "cora_offline_receipt_queue";
const CHANGE_EVENT = "cora-offline-queue-changed";

function notifyChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onQueueChanged(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function getQueue(): QueuedReceipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupted or inaccessible storage - fail safe to an empty queue rather
    // than crash the app over a bad local cache.
    return [];
  }
}

function saveQueue(queue: QueuedReceipt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  notifyChanged();
}

export function addToQueue(item: Omit<QueuedReceipt, "localId" | "queued_at">): QueuedReceipt {
  const entry: QueuedReceipt = {
    ...item,
    localId: crypto.randomUUID(),
    queued_at: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(entry);
  saveQueue(queue);
  return entry;
}

export function removeFromQueue(localId: string) {
  saveQueue(getQueue().filter((q) => q.localId !== localId));
}

// Attempts to push every queued item to Supabase. Items that fail (still
// offline, or a genuine server error) stay queued for the next attempt -
// this pass doesn't distinguish "will never succeed" errors from
// "temporarily offline" ones, which is a reasonable simplification for now
// but worth knowing: a permanently-invalid queued item would retry forever
// rather than surface as a distinct failure state.
export async function syncQueue(): Promise<{ synced: number; remaining: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  const stillPending: QueuedReceipt[] = [];

  for (const item of queue) {
    const { error } = await supabase.from("receipts").insert({
      point_id: item.point_id,
      fee_type: item.fee_type,
      amount: item.amount,
      collector_name: item.collector_name,
    });
    if (error) {
      stillPending.push(item);
    } else {
      synced++;
    }
  }

  saveQueue(stillPending);
  return { synced, remaining: stillPending.length };
}
