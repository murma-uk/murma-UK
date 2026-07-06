import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsTrusted } from "@/hooks/useIsTrusted";
import { LogOut, Plus, User, Shield, Compass, UserCircle2, ShieldCheck } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import SignalLine from "@/components/brand/SignalLine";
import LiveChip from "@/components/brand/LiveChip";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: isTrusted } = useIsTrusted();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-popover/95 backdrop-blur-md">
      <SignalLine />
      <div className="border-b border-border">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Wordmark size="md" withMark />
            <span className="hidden lg:inline-flex">
              <LiveChip>Live · The Signal</LiveChip>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Explore: full button on sm+, icon on mobile */}
            <Link to="/explore" className="hidden sm:block">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>
            <Link to="/explore" className="sm:hidden">
              <Button variant="ghost" size="icon" title="Explore" aria-label="Explore">
                <Compass className="h-4 w-4" />
              </Button>
            </Link>

            {user ? (
              <>
                {/* Add Murma: full on sm+, icon on mobile */}
                <Link to="/explore?create=true" className="hidden sm:block">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Murma
                  </Button>
                </Link>
                <Link to="/explore?create=true" className="sm:hidden">
                  <Button size="icon" title="Add Murma" aria-label="Add Murma">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="Account" aria-label="Account">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-lo">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/me")}>
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      My profile
                    </DropdownMenuItem>
                    {(isAdmin || isTrusted) && (
                      <DropdownMenuItem onClick={() => navigate("/admin/moderation")}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Moderation
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin/categories")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => { await signOut(); navigate("/"); }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
