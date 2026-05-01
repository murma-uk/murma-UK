import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { MapPin, LogOut, Plus, User, Shield } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>Hey, Open Up</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/explore">
            <Button variant="ghost" size="sm" className="font-heading font-medium">
              Explore Map
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/explore?create=true">
                <Button size="sm" className="gap-1.5 font-heading font-medium">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin/categories">
                  <Button variant="ghost" size="sm" className="gap-1.5 font-heading font-medium">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => { await signOut(); navigate("/"); }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-1.5 font-heading font-medium">
                <User className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
