import { useEffect, useState } from "react";
import { Trash2, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchProfilesMap } from "@/lib/profiles";
import { updateUserRole } from "@/lib/capex";
import { fetchAccessRules, addAccessRule, deleteAccessRule } from "@/lib/accessRules";
import type { Profile, UserRole, EmailAccessRule, RuleType } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "pd_staff", label: "PD Staff" },
  { value: "pd_manager", label: "PD Manager" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "developer", label: "Developer" },
];

export function AccountManagement() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [rules, setRules] = useState<EmailAccessRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [newPattern, setNewPattern] = useState("");
  const [newRuleType, setNewRuleType] = useState<RuleType>("block");
  const [newNote, setNewNote] = useState("");
  const [rulesError, setRulesError] = useState<string | null>(null);

  useEffect(() => {
    load();
    loadRules();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const map = await fetchProfilesMap();
      setProfiles(Object.values(map).sort((a, b) => a.full_name.localeCompare(b.full_name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  async function loadRules() {
    setRulesLoading(true);
    try {
      setRules(await fetchAccessRules());
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to load access rules");
    } finally {
      setRulesLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setSavingId(userId);
    setError(null);
    try {
      await updateUserRole(userId, newRole);
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newPattern.trim() || !profile) return;
    setRulesError(null);
    try {
      await addAccessRule(newPattern, newRuleType, newNote || null, profile.id);
      setNewPattern("");
      setNewNote("");
      await loadRules();
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to add rule");
    }
  }

  async function handleDeleteRule(id: string) {
    setRulesError(null);
    try {
      await deleteAccessRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  }

  const hasAllowRules = rules.some((r) => r.rule_type === "allow");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Change roles for existing accounts, and control who can sign up. Visible only to Developer accounts.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.full_name}</td>
                      <td className="text-muted-foreground">{p.email ?? "—"}</td>
                      <td>
                        <select
                          className="h-8 rounded-md border border-input bg-secondary/50 px-2 text-sm"
                          value={p.role}
                          disabled={savingId === p.id}
                          onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <CardTitle>Email Access Rules</CardTitle>
          </div>
          <CardDescription>
            Block always wins over allow. {hasAllowRules
              ? "At least one allow rule exists, so only matching emails can sign up."
              : "No allow rules yet — anyone not blocked can sign up."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddRule} className="flex flex-wrap gap-2 items-start">
            <Input
              placeholder="Pattern, e.g. @filinvestcity.com"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="max-w-xs"
              required
            />
            <select
              className="h-9 rounded-md border border-input bg-secondary/50 px-2 text-sm"
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as RuleType)}
            >
              <option value="block">Block</option>
              <option value="allow">Allow</option>
            </select>
            <Input
              placeholder="Note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit">Add Rule</Button>
          </form>

          {rulesError && <p className="text-sm text-destructive">{rulesError}</p>}

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rulesLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground">
                      No rules yet.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono">{r.pattern}</td>
                      <td>
                        <span
                          className={
                            r.rule_type === "block"
                              ? "inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
                              : "inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
                          }
                        >
                          {r.rule_type === "block" ? "Block" : "Allow"}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{r.note ?? "—"}</td>
                      <td>
                        <button onClick={() => handleDeleteRule(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
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
