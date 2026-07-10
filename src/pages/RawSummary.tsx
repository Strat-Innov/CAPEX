import { useEffect, useState } from "react";
import { fetchEntries } from "@/lib/capex";
import { fetchProfilesMap } from "@/lib/profiles";
import { formatCurrency, formatDate } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import { MONTH_FIELDS, STRATPLAN_FIELDS } from "@/types";
import type { CapexEntry, Profile } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExportButtons } from "@/components/ExportButtons";
import type { ExportColumn } from "@/lib/exporters";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Requestor", key: "requestor" },
  { header: "Project Description", key: "project_name" },
  { header: "New/Carry-over", key: "new_or_carryover" },
  { header: "Description", key: "description" },
  { header: "Status | Stage", key: "stage" },
  { header: "Approval Status", key: "approval_status" },
  { header: "Start Date", key: "start_date" },
  { header: "Completion Date", key: "completion_date" },
  { header: "Total Project Cost", key: "total_project_cost" },
  ...MONTH_FIELDS.map((m, i) => ({ header: MONTH_LABELS[i], key: m })),
  { header: "2028", key: "y2028" },
  { header: "2029", key: "y2029" },
  { header: "2030", key: "y2030" },
  { header: "2031", key: "y2031" },
];

export function RawSummary() {
  const [entries, setEntries] = useState<CapexEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchEntries(), fetchProfilesMap()]).then(([e, p]) => {
      setEntries(e);
      setProfiles(p);
      setLoading(false);
    });
  }, []);

  const rows = entries.map((e) => ({
    requestor: profiles[e.created_by]?.full_name ?? "—",
    project_name: e.project_name,
    new_or_carryover: e.new_or_carryover,
    description: e.description ?? "",
    stage: e.stage,
    approval_status: STATUS_LABELS[e.status],
    start_date: formatDate(e.start_date),
    completion_date: formatDate(e.completion_date),
    total_project_cost: e.total_project_cost,
    ...Object.fromEntries(MONTH_FIELDS.map((m) => [m, e[m]])),
    y2028: e.y2028,
    y2029: e.y2029,
    y2030: e.y2030,
    y2031: e.y2031,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CAPEX Raw Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every entry, every status, live from the database — {entries.length} record(s).
          </p>
        </div>
        <ExportButtons
          filename="capex-raw-summary"
          sheetName="CAPEX RAW"
          title="Capital Expenditures Schedule"
          columns={EXPORT_COLUMNS}
          rows={rows}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Cost Detail</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requestor</th>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Approval Status</th>
                  <th>Total Cost</th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                  {STRATPLAN_FIELDS.map((y) => (
                    <th key={y}>{y.replace("y", "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={20} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="text-center py-8 text-muted-foreground">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id}>
                      <td className="text-muted-foreground">{profiles[e.created_by]?.full_name ?? "—"}</td>
                      <td className="font-medium">{e.project_name}</td>
                      <td>{e.new_or_carryover}</td>
                      <td>{e.stage}</td>
                      <td className="text-muted-foreground text-xs">{STATUS_LABELS[e.status]}</td>
                      <td className="font-mono">{formatCurrency(e.total_project_cost)}</td>
                      {MONTH_FIELDS.map((m) => (
                        <td key={m} className="font-mono text-xs">{formatCurrency(e[m])}</td>
                      ))}
                      {STRATPLAN_FIELDS.map((y) => (
                        <td key={y} className="font-mono text-xs">{formatCurrency(e[y])}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
