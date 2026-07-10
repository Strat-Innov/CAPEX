import { MONTH_FIELDS } from "@/types";
import type { CapexEntry, NewOrCarryover } from "@/types";

export interface CapexSummary {
  entries: CapexEntry[];
  projectCount: number;
  totalCost: number;
  ongoingCount: number;
  plannedCount: number;
  substantiallyCompletedCount: number;
  completedClosedCount: number;
  fy27Total: number;
  y2028Total: number;
  y2029Total: number;
  y2030Total: number;
  y2031Total: number;
  grandTotal: number;
}

export function computeCapexSummary(allEntries: CapexEntry[], type: NewOrCarryover): CapexSummary {
  const entries = allEntries.filter((e) => e.new_or_carryover === type && e.status === "approved");

  const fy27Total = entries.reduce((sum, e) => sum + MONTH_FIELDS.reduce((s, m) => s + e[m], 0), 0);
  const y2028Total = entries.reduce((sum, e) => sum + e.y2028, 0);
  const y2029Total = entries.reduce((sum, e) => sum + e.y2029, 0);
  const y2030Total = entries.reduce((sum, e) => sum + e.y2030, 0);
  const y2031Total = entries.reduce((sum, e) => sum + e.y2031, 0);

  return {
    entries,
    projectCount: entries.length,
    totalCost: entries.reduce((sum, e) => sum + e.total_project_cost, 0),
    ongoingCount: entries.filter((e) => e.stage === "Ongoing").length,
    plannedCount: entries.filter((e) => e.stage === "Planned").length,
    substantiallyCompletedCount: entries.filter((e) => e.stage === "Substantially Completed").length,
    completedClosedCount: entries.filter((e) => e.stage === "Completed/Closed").length,
    fy27Total,
    y2028Total,
    y2029Total,
    y2030Total,
    y2031Total,
    grandTotal: fy27Total + y2028Total + y2029Total + y2030Total + y2031Total,
  };
}
