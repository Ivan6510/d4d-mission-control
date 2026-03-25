import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as SupabaseClient);

/**
 * Returns true if the Supabase client is configured and reachable.
 * Result is cached for 30 seconds to avoid repeated pings.
 */
let _available: boolean | null = null;
let _checkedAt = 0;

export async function isSupabaseAvailable(): Promise<boolean> {
  if (!supabase) return false;
  const now = Date.now();
  if (_available !== null && now - _checkedAt < 30_000) return _available;
  try {
    const { error } = await supabase.from("deals").select("id", { count: "exact", head: true });
    _available = !error;
  } catch {
    _available = false;
  }
  _checkedAt = now;
  return _available;
}
