import { MONTH_FIELDS, STRATPLAN_FIELDS } from "@/types";
import { formatCurrency } from "@/lib/format";

/**
 * Total Project Cost must equal the sum of FY27 monthly figures plus
 * the 5-Year Strat Plan figures. Returns an error message if it
 * doesn't match, or null if it's valid. Shared by New Entry and the
 * PD Manager/Finance Manager edit form so the rule lives in one place.
 */
export function validateCostSum(
  totalProjectCost: number,
  months: Record<string, number>,
  stratplan: Record<string, number>
): string | null {
  const sumOfPeriods =
    MONTH_FIELDS.reduce((s, m) => s + (months[m] || 0), 0) +
    STRATPLAN_FIELDS.reduce((s, y) => s + (stratplan[y] || 0), 0);

  if (Math.round(sumOfPeriods * 100) !== Math.round(totalProjectCost * 100)) {
    return `Total Project Cost (${formatCurrency(totalProjectCost)}) must equal the sum of FY27 Budget (Jan–Dec) and 5-Year Strat Plan (2028–2031), which currently adds up to ${formatCurrency(sumOfPeriods)}.`;
  }
  return null;
}
