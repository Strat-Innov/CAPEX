import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

/** PD Staff sign-in — passwordless, magic link only. Access is still
 * gated by the developer-managed email block/allow rules, enforced at
 * the database level regardless of this page's own logic. */
export function StaffLogin() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signInWithMagicLink(email, fullName || undefined);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">Filinvest Alabang</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">CAPEX Tracker</p>
            </div>
          </div>
          <CardTitle>PD Staff sign-in</CardTitle>
          <CardDescription>No password needed — we'll email you a one-time sign-in link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-success">
              Check your inbox (and spam) for a sign-in link. Click it to continue — no password required.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Full name (only needed the first time)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send sign-in link"}
              </Button>
            </form>
          )}

          <Link to="/login" className="text-xs text-muted-foreground hover:text-primary block mt-4">
            PD Manager or Finance Manager? Sign in here →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
