import { supabase } from "@/lib/supabase";
import type { EmailAccessRule, RuleType } from "@/types";

export async function fetchAccessRules(): Promise<EmailAccessRule[]> {
  const { data, error } = await supabase
    .from("email_access_rules")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch access rules: ${error.message}`);
  return data as EmailAccessRule[];
}

export async function addAccessRule(
  pattern: string,
  ruleType: RuleType,
  note: string | null,
  createdBy: string
): Promise<void> {
  const { error } = await supabase
    .from("email_access_rules")
    .insert({ pattern: pattern.trim(), rule_type: ruleType, note, created_by: createdBy });
  if (error) throw new Error(`Failed to add rule: ${error.message}`);
}

export async function deleteAccessRule(id: string): Promise<void> {
  const { error } = await supabase.from("email_access_rules").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete rule: ${error.message}`);
}
