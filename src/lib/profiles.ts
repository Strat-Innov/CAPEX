import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export async function fetchProfilesMap(): Promise<Record<string, Profile>> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
  const map: Record<string, Profile> = {};
  for (const p of data as Profile[]) map[p.id] = p;
  return map;
}
