import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createEntry } from "@/lib/capex";
import { MONTH_FIELDS, STRATPLAN_FIELDS, PROJECT_NAMES } from "@/types";
import type { NewOrCarryover, ProjectStage } from "@/types";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MONTH_LABELS: Record<(typeof MONTH_FIELDS)[number], string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
};

const STRATPLAN_LABELS: Record<(typeof STRATPLAN_FIELDS)[number], string> = {
  y2028: "2028", y2029: "2029", y2030: "2030", y2031: "2031",
};

export function NewEntry() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [newOrCarryover, setNewOrCarryover] = useState<NewOrCarryover | "">("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<ProjectStage | "">("");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [totalProjectCost, setTotalProjectCost] = useState("");
  const [months, setMonths] = useState<Record<string, string>>({});
  const [stratplan, setStratplan] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newOrCarryover || !stage) {
      setError("Please select New/Carry-over and Status | Stage.");
      return;
    }
    if (!projectName) {
      setError("Please select a Project Name.");
      return;
    }
    if (!session) {
      setError("Not signed in.");
      return;
    }

    const monthValues = MONTH_FIELDS.map((m) => Number(months[m]) || 0);
    const stratplanValues = STRATPLAN_FIELDS.map((y) => Number(stratplan[y]) || 0);
    const sumOfPeriods = [...monthValues, ...stratplanValues].reduce((s, v) => s + v, 0);
    const totalCost = Number(totalProjectCost) || 0;

    // Compare in cents to avoid floating-point rounding false-positives.
    if (Math.round(sumOfPeriods * 100) !== Math.round(totalCost * 100)) {
      setError(
        `Total Project Cost (${formatCurrency(totalCost)}) must equal the sum of FY27 Budget (Jan–Dec) and 5-Year Strat Plan (2028–2031), which currently adds up to ${formatCurrency(sumOfPeriods)}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await createEntry(
        {
          project_name: projectName,
          new_or_carryover: newOrCarryover,
          description: description || null,
          stage,
          start_date: startDate,
          completion_date: completionDate,
          total_project_cost: totalCost,
          jan: monthValues[0],
          feb: monthValues[1],
          mar: monthValues[2],
          apr: monthValues[3],
          may: monthValues[4],
          jun: monthValues[5],
          jul: monthValues[6],
          aug: monthValues[7],
          sep: monthValues[8],
          oct: monthValues[9],
          nov: monthValues[10],
          dec: monthValues[11],
          y2028: stratplanValues[0],
          y2029: stratplanValues[1],
          y2030: stratplanValues[2],
          y2031: stratplanValues[3],
        },
        session.user.id
      );
      navigate("/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New CAPEX Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submitting sends this for PD Manager review. You won't be able to edit it after submitting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Name" required>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              >
                <option value="">—</option>
                {PROJECT_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="New/Carry-Over" required>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                value={newOrCarryover}
                onChange={(e) => setNewOrCarryover(e.target.value as NewOrCarryover)}
                required
              >
                <option value="">—</option>
                <option value="New">New</option>
                <option value="Carryover">Carryover</option>
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className="flex w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm min-h-[90px]"
                placeholder="Enter value here"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="Status | Stage" required>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm"
                value={stage}
                onChange={(e) => setStage(e.target.value as ProjectStage)}
                required
              >
                <option value="">—</option>
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Substantially Completed">Substantially Completed</option>
                <option value="Completed/Closed">Completed/Closed</option>
              </select>
            </Field>
            <Field label="Start Date" required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Field>
            <Field label="Completion Date" required>
              <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} required />
            </Field>
            <Field label="Total Project Cost" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter a number"
                value={totalProjectCost}
                onChange={(e) => setTotalProjectCost(e.target.value)}
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FY27 Budget</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MONTH_FIELDS.map((m) => (
              <Field key={m} label={MONTH_LABELS[m]}>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter a number"
                  value={months[m] ?? ""}
                  onChange={(e) => setMonths({ ...months, [m]: e.target.value })}
                />
              </Field>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5-Year Strat Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STRATPLAN_FIELDS.map((y) => (
              <Field key={y} label={STRATPLAN_LABELS[y]}>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter a number"
                  value={stratplan[y] ?? ""}
                  onChange={(e) => setStratplan({ ...stratplan, [y]: e.target.value })}
                />
              </Field>
            ))}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          Sum of FY27 Budget + 5-Year Strat Plan:{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatCurrency(
              [...MONTH_FIELDS.map((m) => Number(months[m]) || 0), ...STRATPLAN_FIELDS.map((y) => Number(stratplan[y]) || 0)].reduce(
                (s, v) => s + v,
                0
              )
            )}
          </span>{" "}
          — must match Total Project Cost above.
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/requests")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
