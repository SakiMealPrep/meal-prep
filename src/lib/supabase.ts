import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const resolvedSupabaseKey = supabaseAnonKey ?? supabasePublishableKey;

export const supabaseConfigError =
  !supabaseUrl || !resolvedSupabaseKey
    ? "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)."
    : "";

export const hasSupabaseConfig = !supabaseConfigError;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, resolvedSupabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  return supabase;
}
