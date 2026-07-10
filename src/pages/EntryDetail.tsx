import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchEntries,
  fetchHistory,
  approveByPdManager,
  rejectByPdManager,
  approveByFinanceManager,
  rejectByFinanceManager,
  updateEntryFields,
} from "@/lib/capex";
import { fetchProfilesMap } from "@/lib/profiles";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/status";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { validateCostSum } from "@/lib/validation";
import { MONTH_FIELDS, STRATPLAN_FIELDS, PROJECT_NAMES } from "@/types";
import type { CapexEntry, Profile, ApprovalHistoryEntry, NewOrCarryover, ProjectStage } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted",
  pd_manager_approved: "Approved by PD Manager",
  pd_manager_rejected: "Rejected by PD Manager",
  finance_approved: "Approved by Finance Manager",
  finance_rejected: "Rejected by Finance Manager",
};

const MONTH_LABELS: Record<(typeof MONTH_FIELDS)[number], string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
};
const STRATPLAN_LABELS: Record<(typeof STRATPLAN_FIELDS)[number], string> = {
  y2028: "2028", y2029: "2029", y2030: "2030", y2031: "2031",
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

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newOrCarryover, setNewOrCarryover] = useState<NewOrCarryover>("New");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<ProjectStage>("Planned");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [totalProjectCost, setTotalProjectCost] = useState("");
  const [months, setMonths] = useState<Record<string, string>>({});
  const [stratplan, setStratplan] = useState<Record<string, string>>({});

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

  const canActAsPdManager =
    (profile.role === "pd_manager" || profile.role === "developer") && entry.status === "pending_pd_manager";
  const canActAsFinance =
    (profile.role === "finance_manager" || profile.role === "developer") && entry.status === "pending_finance_manager";
  const canEdit = canActAsPdManager || canActAsFinance;

  function startEditing() {
    if (!entry) return;
    setProjectName(entry.project_name);
    setNewOrCarryover(entry.new_or_carryover);
    setDescription(entry.description ?? "");
    setStage(entry.stage);
    setStartDate(entry.start_date);
    setCompletionDate(entry.completion_date);
    setTotalProjectCost(String(entry.total_project_cost));
    setMonths(Object.fromEntries(MONTH_FIELDS.map((m) => [m, String(entry[m])])));
    setStratplan(Object.fromEntries(STRATPLAN_FIELDS.map((y) => [y, String(entry[y])])));
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!entry) return;
    setEditError(null);

    const monthValues = Object.fromEntries(MONTH_FIELDS.map((m) => [m, Number(months[m]) || 0]));
    const stratplanValues = Object.fromEntries(STRATPLAN_FIELDS.map((y) => [y, Number(stratplan[y]) || 0]));
    const totalCost = Number(totalProjectCost) || 0;

    const validationError = validateCostSum(totalCost, monthValues, stratplanValues);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditSaving(true);
    try {
      await updateEntryFields(entry.id, {
        project_name: projectName,
        new_or_carryover: newOrCarryover,
        description: description || null,
        stage,
        start_date: startDate,
        completion_date: completionDate,
        total_project_cost: totalCost,
        jan: monthValues.jan, feb: monthValues.feb, mar: monthValues.mar, apr: monthValues.apr,
        may: monthValues.may, jun: monthValues.jun, jul: monthValues.jul, aug: monthValues.aug,
        sep: monthValues.sep, oct: monthValues.oct, nov: monthValues.nov, dec: monthValues.dec,
        y2028: stratplanValues.y2028, y2029: stratplanValues.y2029, y2030: stratplanValues.y2030, y2031: stratplanValues.y2031,
      });
      await load();
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  }

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

      {isEditing ? (
        <Card className="border-primary/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Editing: {entry.project_name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditField label="Project Name">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                >
                  {PROJECT_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </EditField>
              <EditField label="New/Carry-Over">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                  value={newOrCarryover}
                  onChange={(e) => setNewOrCarryover(e.target.value as NewOrCarryover)}
                >
                  <option value="New">New</option>
                  <option value="Carryover">Carryover</option>
                </select>
              </EditField>
              <EditField label="Description" className="sm:col-span-2">
                <textarea
                  className="flex w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </EditField>
              <EditField label="Status | Stage">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProjectStage)}
                >
                  <option value="Planned">Planned</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Substantially Completed">Substantially Completed</option>
                  <option value="Completed/Closed">Completed/Closed</option>
                </select>
              </EditField>
              <EditField label="Total Project Cost">
                <Input type="number" step="0.01" value={totalProjectCost} onChange={(e) => setTotalProjectCost(e.target.value)} />
              </EditField>
              <EditField label="Start Date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </EditField>
              <EditField label="Completion Date">
                <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
              </EditField>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">FY27 Budget</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {MONTH_FIELDS.map((m) => (
                  <EditField key={m} label={MONTH_LABELS[m]}>
                    <Input type="number" step="0.01" value={months[m] ?? ""} onChange={(e) => setMonths({ ...months, [m]: e.target.value })} />
                  </EditField>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">5-Year Strat Plan</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STRATPLAN_FIELDS.map((y) => (
                  <EditField key={y} label={STRATPLAN_LABELS[y]}>
                    <Input type="number" step="0.01" value={stratplan[y] ?? ""} onChange={(e) => setStratplan({ ...stratplan, [y]: e.target.value })} />
                  </EditField>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Sum of FY27 Budget + 5-Year Strat Plan:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(
                  [...MONTH_FIELDS.map((m) => Number(months[m]) || 0), ...STRATPLAN_FIELDS.map((y) => Number(stratplan[y]) || 0)].reduce((s, v) => s + v, 0)
                )}
              </span>{" "}
              — must match Total Project Cost above.
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-3">
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={editSaving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{entry.project_name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Requested by {profiles[entry.created_by]?.full_name ?? "—"} · {formatDate(entry.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
                {STATUS_LABELS[entry.status]}
              </span>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Pencil size={13} /> Edit
                </Button>
              )}
            </div>
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
      )}

      {!isEditing && (
        <>
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
        </>
      )}

      {!isEditing && (canActAsPdManager || canActAsFinance) && (
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

function EditField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
