import { supabase } from "./supabaseClient";
import type { Account } from "./types";

// Shared by LoginScreen (right after sign-in) and App (restoring a session
// on page refresh) so both paths build the Account object the same way.
export async function fetchAccountForUser(userId: string, email: string): Promise<Account | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  return {
    id: profile.id,
    email,
    role: profile.role,
    name: profile.name,
    roleLabel: profile.role_label,
    collectionPointId: profile.collection_point_id ?? undefined,
    ward: profile.ward ?? undefined,
    vehicleId: profile.vehicle_id ?? undefined,
  };
}
