"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tenbxnjymiiegarxdoxf.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_C8Snkb1nlkgSQHwOzKH3aA_y_5NbRCB";

export const supabase: SupabaseClient = createClient(url, key);
