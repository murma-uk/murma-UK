import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LogOut, Plus, User, Shield } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import BrickStripe from "@/components/brand/BrickStripe";
import LiveChip from "@/components/brand/LiveChip";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-popover/95 backdrop-blur-md">
      <BrickStripe />
      <div className="border-b border-border">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <Wordmark size="md" withMark />
            <span className="hidden md:inline-flex">
              <LiveChip>Live · Demand Signal</LiveChip>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Link to="/explore">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>

            {user ? (
              <>
                <Link to="/explore?create=true">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    New Request
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin/categories">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/me">
                  <Button variant="ghost" size="icon" title="My profile">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
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
                <Button size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
