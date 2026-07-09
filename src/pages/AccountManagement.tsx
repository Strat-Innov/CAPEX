import { useEffect, useState } from "react";
import { fetchProfilesMap } from "@/lib/profiles";
import { updateUserRole } from "@/lib/capex";
import type { Profile, UserRole } from "@/types";
import { Card } from "@/components/ui/card";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "pd_staff", label: "PD Staff" },
  { value: "pd_manager", label: "PD Manager" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "developer", label: "Developer" },
];

export function AccountManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    load();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Change roles for existing accounts. Visible only to Developer accounts.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
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
      </Card>
    </div>
  );
}
