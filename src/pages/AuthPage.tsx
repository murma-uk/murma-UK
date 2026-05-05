import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import LogoMark from "@/components/brand/LogoMark";
import LiveChip from "@/components/brand/LiveChip";
import BrickStripe from "@/components/brand/BrickStripe";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/explore";

  useEffect(() => {
    setHasPendingDraft(!!sessionStorage.getItem("pendingRequest"));
  }, []);

  if (user) {
    navigate(redirectTo);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast({ title: "Check your email", description: "We sent you a confirmation link." });
      } else {
        await signIn(email, password);
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BrickStripe />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="spray-hey w-full max-w-md rounded-md border-[1.5px] border-border bg-popover p-7 shadow-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <LogoMark variant="solidGreen" size={72} className="mb-4 rounded-md shadow-card" />
            <Wordmark size="lg" />
            <div className="mt-3 inline-flex">
              <LiveChip>{isSignUp ? "Create account" : "Sign in"}</LiveChip>
            </div>
          </div>

          {hasPendingDraft && (
            <Alert className="mb-5 border-primary/30 bg-primary/5">
              <FileText className="h-4 w-4 text-primary" />
              <AlertDescription className="font-mono text-xs">
                Your request draft is saved — {isSignUp ? "sign up and confirm your email" : "sign in"} to post it.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  placeholder="e.g. Jordan from SE15"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-5 w-full text-center font-mono text-xs uppercase tracking-[0.15em] text-text-lo transition-colors hover:text-primary"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
