import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import LogoMark from "@/components/brand/LogoMark";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center text-center">
        <LogoMark variant="light" size={96} className="mb-6" />
        <h1 className="font-display text-6xl uppercase tracking-[0.04em]">404</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          This door doesn&apos;t open
        </p>
        <Link
          to="/"
          className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
        >
          ← Return home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
