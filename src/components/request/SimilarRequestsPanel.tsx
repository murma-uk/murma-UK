import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowBigUp, Users, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRequestPath } from "@/lib/slug";
import type { SimilarRequest } from "@/lib/similarRequests";

interface Props {
  results: SimilarRequest[];
  loading: boolean;
  onJoin: (target: SimilarRequest) => void;
  onDismiss?: () => void;
}

/**
 * Inline panel that surfaces similar existing murmas nearby and lets the
 * user back one instead of posting a new one.
 */
export default function SimilarRequestsPanel({ results, loading, onJoin, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (loading && results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
        Checking for similar murmas nearby…
      </div>
    );
  }
  if (results.length === 0) return null;

  const shown = expanded ? results : results.slice(0, 2);
  const top = results[0];
  const headline =
    results.length === 1
      ? "1 similar murma nearby"
      : `${results.length} similar murmas nearby`;

  return (
    <div className="rounded-lg border-[1.5px] border-civic/40 bg-civic/5 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-civic">
            {headline}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Joining forces makes the murmur louder than posting separately.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss similar murmas"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ul className="space-y-1.5">
        {shown.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2 rounded-sm border border-border bg-popover p-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm font-semibold leading-tight">
                {r.title}
              </p>
              <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
                <span className="inline-flex items-center gap-1">
                  <ArrowBigUp className="h-3 w-3" />
                  {r.upvote_count}
                </span>
                {r.cosigner_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {r.cosigner_count}
                  </span>
                )}
                <span>{r.distance_km < 0.1 ? "<0.1" : r.distance_km.toFixed(1)} km</span>
                <span className="truncate">{r.town}</span>
              </p>
            </div>
            <Link
              to={buildRequestPath(r.id, r.slug)}
              target="_blank"
              className="text-muted-foreground hover:text-foreground"
              aria-label="View request"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Button
              type="button"
              size="sm"
              variant={r.id === top.id ? "default" : "outline"}
              className="h-7 px-2 text-[11px]"
              onClick={() => onJoin(r)}
            >
              Join
            </Button>
          </li>
        ))}
      </ul>

      {results.length > 2 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-civic hover:underline"
        >
          Show {results.length - 2} more
        </button>
      )}
    </div>
  );
}
