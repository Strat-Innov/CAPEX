import { useEffect, useState } from "react";
import { fetchEntries } from "@/lib/capex";
import { computeCapexSummary, type CapexSummary } from "@/lib/capexSummary";
import { formatCurrency, formatDate } from "@/lib/format";
import { MONTH_FIELDS, STRATPLAN_FIELDS } from "@/types";
import type { NewOrCarryover } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExportButtons } from "@/components/ExportButtons";
import type { ExportColumn } from "@/lib/exporters";

const DETAIL_COLUMNS: ExportColumn[] = [
  { header: "Project Description", key: "project_name" },
  { header: "Description", key: "description" },
  { header: "Status | Stage", key: "stage" },
  { header: "Start Date", key: "start_date" },
  { header: "Completion Date", key: "completion_date" },
  { header: "Total Project Cost", key: "total_project_cost" },
  { header: "FY27", key: "fy27" },
  { header: "2028", key: "y2028" },
  { header: "2029", key: "y2029" },
  { header: "2030", key: "y2030" },
  { header: "2031", key: "y2031" },
  { header: "2027 to 2031", key: "total_2027_2031" },
];

export function NewCarryoverSummary() {
  const [loading, setLoading] = useState(true);
  const [newSummary, setNewSummary] = useState<CapexSummary | null>(null);
  const [carryoverSummary, setCarryoverSummary] = useState<CapexSummary | null>(null);

  useEffect(() => {
    fetchEntries().then((entries) => {
      setNewSummary(computeCapexSummary(entries, "New"));
      setCarryoverSummary(computeCapexSummary(entries, "Carryover"));
      setLoading(false);
    });
  }, []);

  if (loading || !newSummary || !carryoverSummary) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CAPEX Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approved projects only, split by New vs. Carry-over.
        </p>
      </div>

      <SummarySection title="New Projects" type="New" summary={newSummary} />
      <SummarySection title="Carry-Over Projects" type="Carryover" summary={carryoverSummary} />
    </div>
  );
}

function SummarySection({ title, type, summary }: { title: string; type: NewOrCarryover; summary: CapexSummary }) {
  const rows = summary.entries.map((e) => ({
    project_name: e.project_name,
    description: e.description ?? "",
    stage: e.stage,
    start_date: formatDate(e.start_date),
    completion_date: formatDate(e.completion_date),
    total_project_cost: e.total_project_cost,
    fy27: MONTH_FIELDS.reduce((s, m) => s + e[m], 0),
    y2028: e.y2028,
    y2029: e.y2029,
    y2030: e.y2030,
    y2031: e.y2031,
    total_2027_2031: MONTH_FIELDS.reduce((s, m) => s + e[m], 0) + STRATPLAN_FIELDS.reduce((s, y) => s + e[y], 0),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ExportButtons
          filename={`capex-${type.toLowerCase()}-summary`}
          sheetName={`CAPEX ${type.toUpperCase()}`}
          title={`Capital Expenditures ${title} Overview`}
          columns={DETAIL_COLUMNS}
          rows={rows}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="Project Count" value={String(summary.projectCount)} />
        <StatBox label={`Total ${type} Cost`} value={formatCurrency(summary.totalCost)} />
        <StatBox label="Ongoing" value={String(summary.ongoingCount)} />
        <StatBox label="Planned" value={String(summary.plannedCount)} />
        <StatBox label="Substantially Completed" value={String(summary.substantiallyCompletedCount)} />
        <StatBox label="Completed/Closed" value={String(summary.completedClosedCount)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="FY27" value={formatCurrency(summary.fy27Total)} mono />
        <StatBox label="2028" value={formatCurrency(summary.y2028Total)} mono />
        <StatBox label="2029" value={formatCurrency(summary.y2029Total)} mono />
        <StatBox label="2030" value={formatCurrency(summary.y2030Total)} mono />
        <StatBox label="2031" value={formatCurrency(summary.y2031Total)} mono />
        <StatBox label="2027 to 2031" value={formatCurrency(summary.grandTotal)} mono />
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
                  <th>Project</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Start</th>
                  <th>Completion</th>
                  <th>Total Cost</th>
                  <th>FY27</th>
                  <th>2028</th>
                  <th>2029</th>
                  <th>2030</th>
                  <th>2031</th>
                </tr>
              </thead>
              <tbody>
                {summary.entries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-muted-foreground">
                      No approved {type.toLowerCase()} projects yet.
                    </td>
                  </tr>
                ) : (
                  summary.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium">{e.project_name}</td>
                      <td className="text-muted-foreground">{e.description}</td>
                      <td>{e.stage}</td>
                      <td className="text-muted-foreground">{formatDate(e.start_date)}</td>
                      <td className="text-muted-foreground">{formatDate(e.completion_date)}</td>
                      <td className="font-mono">{formatCurrency(e.total_project_cost)}</td>
                      <td className="font-mono">{formatCurrency(MONTH_FIELDS.reduce((s, m) => s + e[m], 0))}</td>
                      <td className="font-mono">{formatCurrency(e.y2028)}</td>
                      <td className="font-mono">{formatCurrency(e.y2029)}</td>
                      <td className="font-mono">{formatCurrency(e.y2030)}</td>
                      <td className="font-mono">{formatCurrency(e.y2031)}</td>
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

function StatBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="stat-card">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">{label}</span>
      <span className={mono ? "font-mono text-lg font-bold" : "text-lg font-bold"}>{value}</span>
    </div>
  );
}
