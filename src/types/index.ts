export type UserRole = "pd_staff" | "pd_manager" | "finance_manager";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type NewOrCarryover = "New" | "Carryover";

export type ProjectStage = "Planned" | "Ongoing" | "Substantially Completed" | "Completed/Closed";

export type CapexStatus =
  | "pending_pd_manager"
  | "pending_finance_manager"
  | "approved"
  | "rejected_by_pd_manager"
  | "rejected_by_finance_manager";

export interface CapexEntry {
  id: string;
  created_by: string;
  status: CapexStatus;
  project_name: string;
  new_or_carryover: NewOrCarryover;
  description: string | null;
  stage: ProjectStage;
  start_date: string;
  completion_date: string;
  total_project_cost: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  y2028: number;
  y2029: number;
  y2030: number;
  y2031: number;
  created_at: string;
  updated_at: string;
}

export const MONTH_FIELDS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

export const STRATPLAN_FIELDS = ["y2028", "y2029", "y2030", "y2031"] as const;

export interface ApprovalHistoryEntry {
  id: string;
  entry_id: string;
  actor_id: string;
  action: string;
  comment: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  entry_id: string;
  recipient_role: UserRole;
  channel: "teams" | "outlook";
  message: string;
  sent: boolean;
  created_at: string;
}

/** New entry payload — everything the PD Staff form actually submits. */
export type NewCapexEntryInput = Omit<
  CapexEntry,
  "id" | "created_by" | "status" | "created_at" | "updated_at"
>;
