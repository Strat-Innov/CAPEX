import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, FilePlus2, LogOut, Building2, ShieldCheck, FileBarChart, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const { profile, signOut } = useAuth();

  const canSeeSummaries = profile?.role === "pd_manager" || profile?.role === "finance_manager" || profile?.role === "developer";

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/requests", label: "Requests", icon: ListChecks },
    ...(profile?.role === "pd_staff" || profile?.role === "developer" ? [{ to: "/new-entry", label: "New Entry", icon: FilePlus2 }] : []),
    ...(canSeeSummaries ? [{ to: "/summary", label: "CAPEX Summary", icon: FileBarChart }] : []),
    ...(canSeeSummaries ? [{ to: "/summary/raw", label: "Raw Summary", icon: Database }] : []),
    ...(profile?.role === "developer" ? [{ to: "/account-management", label: "Account Management", icon: ShieldCheck }] : []),
  ];

  const roleLabel =
    profile?.role === "pd_manager"
      ? "PD Manager"
      : profile?.role === "finance_manager"
      ? "Finance Manager"
      : profile?.role === "developer"
      ? "Developer"
      : "PD Staff";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card/60 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">Filinvest Alabang</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">CAPEX Tracker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4 space-y-2">
        <div>
          <p className="text-xs font-medium text-foreground">{profile?.full_name}</p>
          <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
