import { supabase } from "@/lib/supabase";
import type { CapexEntry, NewCapexEntryInput, ApprovalHistoryEntry, NotificationLog } from "@/types";

export async function fetchEntries(): Promise<CapexEntry[]> {
  const { data, error } = await supabase
    .from("capex_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
  return data as CapexEntry[];
}

export async function createEntry(input: NewCapexEntryInput, userId: string): Promise<CapexEntry> {
  const { data, error } = await supabase
    .from("capex_entries")
    .insert({ ...input, created_by: userId, status: "pending_pd_manager" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create entry: ${error.message}`);

  const entry = data as CapexEntry;
  await logHistory(entry.id, userId, "submitted", null);
  await logNotification(entry.id, "pd_manager", "teams", `New CAPEX entry "${entry.project_name}" submitted for your review.`);
  return entry;
}

export async function updateEntryFields(
  entryId: string,
  patch: Partial<NewCapexEntryInput>
): Promise<void> {
  const { error } = await supabase
    .from("capex_entries")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) throw new Error(`Failed to update entry: ${error.message}`);
}

export async function approveByPdManager(entryId: string, projectName: string, actorId: string, comment: string | null): Promise<void> {
  const { error } = await supabase
    .from("capex_entries")
    .update({ status: "pending_finance_manager", updated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) throw new Error(`Failed to approve entry: ${error.message}`);

  await logHistory(entryId, actorId, "pd_manager_approved", comment);
  await logNotification(entryId, "finance_manager", "outlook", `CAPEX entry "${projectName}" approved by PD Manager, awaiting your approval.`);
}

export async function rejectByPdManager(entryId: string, actorId: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from("capex_entries")
    .update({ status: "rejected_by_pd_manager", updated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) throw new Error(`Failed to reject entry: ${error.message}`);

  await logHistory(entryId, actorId, "pd_manager_rejected", comment);
}

export async function approveByFinanceManager(entryId: string, actorId: string, comment: string | null): Promise<void> {
  const { error } = await supabase
    .from("capex_entries")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) throw new Error(`Failed to approve entry: ${error.message}`);

  await logHistory(entryId, actorId, "finance_approved", comment);
}

export async function rejectByFinanceManager(entryId: string, actorId: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from("capex_entries")
    .update({ status: "rejected_by_finance_manager", updated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) throw new Error(`Failed to reject entry: ${error.message}`);

  await logHistory(entryId, actorId, "finance_rejected", comment);
}

async function logHistory(entryId: string, actorId: string, action: string, comment: string | null): Promise<void> {
  const { error } = await supabase
    .from("approval_history")
    .insert({ entry_id: entryId, actor_id: actorId, action, comment });
  if (error) throw new Error(`Failed to log approval history: ${error.message}`);
}

async function logNotification(
  entryId: string,
  recipientRole: "pd_manager" | "finance_manager",
  channel: "teams" | "outlook",
  message: string
): Promise<void> {
  // Phase 1: mocked. Logged to the database as if delivered — no real
  // Microsoft Graph API call yet. Real Teams/Outlook delivery is a
  // separate, later phase once Azure AD app registration is in place.
  const { error } = await supabase
    .from("notifications")
    .insert({ entry_id: entryId, recipient_role: recipientRole, channel, message, sent: true });
  if (error) throw new Error(`Failed to log notification: ${error.message}`);
}

export async function fetchHistory(entryId: string): Promise<ApprovalHistoryEntry[]> {
  const { data, error } = await supabase
    .from("approval_history")
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to fetch history: ${error.message}`);
  return data as ApprovalHistoryEntry[];
}

export async function fetchNotifications(): Promise<NotificationLog[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return data as NotificationLog[];
}
