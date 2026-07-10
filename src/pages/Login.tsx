import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export function Login() {
  const { signIn, signUp, signInWithMagicLink, requestPasswordReset } = useAuth();
  const [audience, setAudience] = useState<"pd_staff" | "manager">("manager");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePdStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signInWithMagicLink(email, fullName || undefined);
    setLoading(false);
    if (result.error) setError(result.error);
    else setMagicLinkSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "forgot") {
      const result = await requestPasswordReset(email);
      setLoading(false);
      if (result.error) setError(result.error);
      else setResetSent(true);
      return;
    }

    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, fullName);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setSignedUp(true);
    }
  }

  function switchMode(next: "signin" | "signup" | "forgot") {
    setMode(next);
    setError(null);
    setSignedUp(false);
    setResetSent(false);
  }

  function switchAudience(next: "pd_staff" | "manager") {
    setAudience(next);
    setError(null);
    setMagicLinkSent(false);
    setMode("signin");
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

          <div className="flex rounded-md border border-border overflow-hidden mb-3">
            <button
              onClick={() => switchAudience("pd_staff")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                audience === "pd_staff" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              PD Staff
            </button>
            <button
              onClick={() => switchAudience("manager")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                audience === "manager" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              PD Manager / Finance
            </button>
          </div>

          {audience === "pd_staff" ? (
            <>
              <CardTitle>Sign in with email</CardTitle>
              <CardDescription>No password needed — we'll email you a one-time sign-in link.</CardDescription>
            </>
          ) : (
            <CardTitle>
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
            </CardTitle>
          )}
          {audience === "manager" && (
            <CardDescription>
              {mode === "signin" && "Use your assigned CAPEX Tracker credentials."}
              {mode === "signup" && "New accounts default to PD Staff — ask an admin to elevate your role."}
              {mode === "forgot" && "Enter your account email — we'll send a link to set a new password."}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {audience === "pd_staff" ? (
            magicLinkSent ? (
              <p className="text-sm text-success">
                Check your inbox (and spam) for a sign-in link. Click it to continue — no password required.
              </p>
            ) : (
              <form onSubmit={handlePdStaffSubmit} className="space-y-3">
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
            )
          ) : mode === "forgot" && resetSent ? (
            <p className="text-sm text-success">
              If an account exists for that email, a reset link has been sent. Check your inbox (and spam).
            </p>
          ) : mode === "signup" && signedUp ? (
            <p className="text-sm text-success">
              Account created. Check your email to confirm, then sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <Input
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {mode !== "forgot" && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
              </Button>
            </form>
          )}

          {audience === "manager" && (
            <div className="mt-4 space-y-1.5">
              {mode === "signin" && (
                <>
                  <button onClick={() => switchMode("forgot")} className="text-xs text-muted-foreground hover:text-primary block">
                    Forgot your password?
                  </button>
                  <button onClick={() => switchMode("signup")} className="text-xs text-muted-foreground hover:text-primary block">
                    Need an account? Sign up
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button onClick={() => switchMode("signin")} className="text-xs text-muted-foreground hover:text-primary block">
                  Already have an account? Sign in
                </button>
              )}
              {mode === "forgot" && (
                <button onClick={() => switchMode("signin")} className="text-xs text-muted-foreground hover:text-primary block">
                  Back to sign in
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
