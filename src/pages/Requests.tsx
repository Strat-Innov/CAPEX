import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchEntries } from "@/lib/capex";
import { fetchProfilesMap } from "@/lib/profiles";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/status";
import type { CapexEntry, Profile } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

export function Requests() {
  const [entries, setEntries] = useState<CapexEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([fetchEntries(), fetchProfilesMap()])
      .then(([e, p]) => {
        setEntries(e);
        setProfiles(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const requestor = profiles[e.created_by]?.full_name ?? "";
    return e.project_name.toLowerCase().includes(q) || requestor.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} CAPEX request(s)</p>
        </div>
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search project or requestor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Requestor</th>
                <th>Stage</th>
                <th>Total Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link to={`/requests/${e.id}`} className="font-medium hover:text-primary hover:underline">
                        {e.project_name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{profiles[e.created_by]?.full_name ?? "—"}</td>
                    <td>{e.stage}</td>
                    <td className="font-mono">{formatCurrency(e.total_project_cost)}</td>
                    <td>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(e.status)}`}>
                        {STATUS_LABELS[e.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
