interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border-[1.5px] border-border bg-popover px-2 py-3 text-center">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-lo">{label}</span>
      <span className="mt-1 font-display text-2xl leading-none tracking-[0.02em] text-foreground">{value}</span>
      {sub && (
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-lo">{sub}</span>
      )}
    </div>
  );
}

export function formatLiveSince(iso: string): string {
  const created = new Date(iso).getTime();
  const diffMs = Date.now() - created;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}
