import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and early rather than letting every screen silently get
  // undefined data — much easier to debug than a wall of blank screens.
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Explicit rather than relying on defaults: keep the session in local
    // storage and let the SDK silently refresh it in the background. This
    // is what lets someone stay logged in across app restarts without a
    // fresh network round trip every time - the actual token lifetime is
    // controlled by the JWT expiry setting in the Supabase dashboard
    // (Authentication > Settings), not here.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
