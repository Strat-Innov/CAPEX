import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, fullName);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setSignedUp(true);
    }
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
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Use your assigned CAPEX Tracker credentials." : "New accounts default to PD Staff — ask an admin to elevate your role."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signedUp ? (
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
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setSignedUp(false);
            }}
            className="text-xs text-muted-foreground hover:text-primary mt-4 block"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
