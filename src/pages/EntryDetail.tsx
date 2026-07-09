import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchEntries, fetchHistory, approveByPdManager, rejectByPdManager, approveByFinanceManager, rejectByFinanceManager } from "@/lib/capex";
import { fetchProfilesMap } from "@/lib/profiles";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/status";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { MONTH_FIELDS, STRATPLAN_FIELDS } from "@/types";
import type { CapexEntry, Profile, ApprovalHistoryEntry } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted",
  pd_manager_approved: "Approved by PD Manager",
  pd_manager_rejected: "Rejected by PD Manager",
  finance_approved: "Approved by Finance Manager",
  finance_rejected: "Rejected by Finance Manager",
};

export function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile, session } = useAuth();

  const [entry, setEntry] = useState<CapexEntry | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [history, setHistory] = useState<ApprovalHistoryEntry[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  async function load() {
    if (!id) return;
    const [entries, profileMap, hist] = await Promise.all([fetchEntries(), fetchProfilesMap(), fetchHistory(id)]);
    setEntry(entries.find((e) => e.id === id) ?? null);
    setProfiles(profileMap);
    setHistory(hist);
  }

  if (!entry) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!session || !profile) return null;

  const canActAsPdManager = profile.role === "pd_manager" && entry.status === "pending_pd_manager";
  const canActAsFinance = profile.role === "finance_manager" && entry.status === "pending_finance_manager";

  async function handleApprove() {
    if (!entry) return;
    setBusy(true);
    setError(null);
    try {
      if (canActAsPdManager) {
        await approveByPdManager(entry.id, entry.project_name, profile!.id, comment || null);
      } else if (canActAsFinance) {
        await approveByFinanceManager(entry.id, profile!.id, comment || null);
      }
      await load();
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!entry) return;
    if (!comment.trim()) {
      setError("A comment is required when rejecting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (canActAsPdManager) {
        await rejectByPdManager(entry.id, profile!.id, comment);
      } else if (canActAsFinance) {
        await rejectByFinanceManager(entry.id, profile!.id, comment);
      }
      await load();
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Requests
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{entry.project_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Requested by {profiles[entry.created_by]?.full_name ?? "—"} · {formatDate(entry.created_at)}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
            {STATUS_LABELS[entry.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Metric label="New/Carry-over" value={entry.new_or_carryover} />
          <Metric label="Stage" value={entry.stage} />
          <Metric label="Start Date" value={formatDate(entry.start_date)} />
          <Metric label="Completion Date" value={formatDate(entry.completion_date)} />
          <Metric label="Total Project Cost" value={formatCurrency(entry.total_project_cost)} mono />
        </div>

        {entry.description && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{entry.description}</p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FY27 Budget by Month</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {MONTH_FIELDS.map((m) => (
            <div key={m}>
              <p className="text-xs uppercase text-muted-foreground mb-1">{m}</p>
              <p className="font-mono text-sm">{formatCurrency(entry[m])}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5-Year Strat Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          {STRATPLAN_FIELDS.map((y) => (
            <div key={y}>
              <p className="text-xs uppercase text-muted-foreground mb-1">{y.replace("y", "")}</p>
              <p className="font-mono text-sm">{formatCurrency(entry[y])}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {(canActAsPdManager || canActAsFinance) && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Your Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="flex w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm min-h-[80px]"
              placeholder="Comment (required if rejecting, optional if approving)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button onClick={handleApprove} disabled={busy}>
                <CheckCircle2 size={14} /> Approve
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={busy}>
                <XCircle size={14} /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ACTION_LABELS[h.action] ?? h.action}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{profiles[h.actor_id]?.full_name ?? "—"}</p>
                  {h.comment && <p className="text-sm mt-1">{h.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={mono ? "font-mono text-lg font-bold" : "text-sm font-semibold"}>{value}</p>
    </div>
  );
}
