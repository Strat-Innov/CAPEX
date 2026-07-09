import type { CapexStatus } from "@/types";

export const STATUS_LABELS: Record<CapexStatus, string> = {
  pending_pd_manager: "Pending PD Manager",
  pending_finance_manager: "Pending Finance Manager",
  approved: "Approved",
  rejected_by_pd_manager: "Rejected (PD Manager)",
  rejected_by_finance_manager: "Rejected (Finance)",
};

export function statusBadgeClass(status: CapexStatus): string {
  if (status === "approved") return "border-success/30 bg-success/10 text-success";
  if (status === "rejected_by_pd_manager" || status === "rejected_by_finance_manager")
    return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-warning/30 bg-warning/10 text-warning";
}
