export const PROJECT_NAMES = [
  "Botanika",
  "Two Botanika",
  "Bristol",
  "1001 Parkway",
  "PCC",
  "Westparc A",
  "Westparc B",
  "Westparc C",
  "Entrata 1",
  "Entrata Mall",
  "Entrata Parking",
  "Pioneer Pointe",
  "Studio 1",
  "Studio 2",
  "LaVie",
  "Vivant",
  "Aspen",
  "2301 Civic Place",
  "Civic Prime",
  "FCC CommLots",
  "Golfridge",
  "Land Devt",
  "FNCC",
  "Beaufort",
  "The Signature",
  "Celestia",
  "TH Township",
  "TH Subdivision",
  "CDM 1",
  "CDM 2",
  "Anaheim",
  "Burbank",
  "Catalina",
  "Brentville",
  "Studio N",
  "CDC",
  "Studio City",
  "TEA",
  "Fortune Hill",
  "The Glades",
] as const;

export type UserRole = "pd_staff" | "pd_manager" | "finance_manager" | "developer";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
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

export type RuleType = "block" | "allow";

export interface EmailAccessRule {
  id: string;
  pattern: string;
  rule_type: RuleType;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

/** New entry payload — everything the PD Staff form actually submits. */
export type NewCapexEntryInput = Omit<
  CapexEntry,
  "id" | "created_by" | "status" | "created_at" | "updated_at"
>;
