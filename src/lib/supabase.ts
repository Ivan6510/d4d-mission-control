import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Using untyped client — generate proper types with `supabase gen types` once connected
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
