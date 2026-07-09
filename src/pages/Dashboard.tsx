import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, CheckCircle2, XCircle, FileStack } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchEntries } from "@/lib/capex";
import { fetchProfilesMap } from "@/lib/profiles";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/status";
import { formatCurrency } from "@/lib/format";
import { MONTH_FIELDS } from "@/types";
import type { CapexEntry, Profile } from "@/types";
import { Card } from "@/components/ui/card";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Dashboard() {
  const { profile } = useAuth();
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

  const pendingPdManager = entries.filter((e) => e.status === "pending_pd_manager").length;
  const pendingFinance = entries.filter((e) => e.status === "pending_finance_manager").length;
  const approved = entries.filter((e) => e.status === "approved").length;
  const rejected = entries.filter((e) => e.status.startsWith("rejected")).length;

  const totalFY27Budget = entries
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + MONTH_FIELDS.reduce((s, m) => s + e[m], 0), 0);

  const monthlyData = MONTH_LABELS.map((label, i) => {
    const field = MONTH_FIELDS[i];
    const total = entries.filter((e) => e.status === "approved").reduce((sum, e) => sum + e[field], 0);
    return { month: label, total };
  });

  const actionable = entries.filter((e) => {
    if (profile?.role === "pd_manager") return e.status === "pending_pd_manager";
    if (profile?.role === "finance_manager") return e.status === "pending_finance_manager";
    return false;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approved FY27 budget totals and approval pipeline status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending PD Manager" value={String(pendingPdManager)} />
        <StatCard icon={Clock} label="Pending Finance" value={String(pendingFinance)} />
        <StatCard icon={CheckCircle2} label="Approved" value={String(approved)} />
        <StatCard icon={XCircle} label="Rejected" value={String(rejected)} />
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Approved FY27 Budget
          </span>
          <FileStack size={16} className="text-primary" />
        </div>
        <span className="font-mono text-3xl font-bold">{formatCurrency(totalFY27Budget)}</span>
        <p className="text-xs text-muted-foreground mt-1">
          Sum of approved entries only. Does not yet include actual disbursement/availment data — that requires a separate future integration.
        </p>
      </div>

      <Card>
        <div className="p-5 pb-0">
          <h2 className="text-sm font-semibold">Approved FY27 Budget by Month</h2>
        </div>
        <div className="p-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₱${(v / 1e6).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [formatCurrency(Number(v)), "Budget"]}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {(profile?.role === "pd_manager" || profile?.role === "finance_manager") && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Awaiting Your Action
          </h2>
          <Card>
            {actionable.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nothing awaiting your action.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Requestor</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionable.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <Link to={`/requests/${e.id}`} className="font-medium hover:text-primary hover:underline">
                            {e.project_name}
                          </Link>
                        </td>
                        <td className="text-muted-foreground">{profiles[e.created_by]?.full_name ?? "—"}</td>
                        <td className="font-mono">{formatCurrency(e.total_project_cost)}</td>
                        <td>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(e.status)}`}>
                            {STATUS_LABELS[e.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon size={16} className="text-primary" />
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
