import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hibzwoqdwrgulltudewk.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_FY3g0a2py-sOc7cgqQghHA_VMv4iWM0";

export const supabase = createClient(url, key);
