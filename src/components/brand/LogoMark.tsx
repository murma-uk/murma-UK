import { cn } from "@/lib/utils";

type Variant = "light" | "dark" | "solidGreen" | "ink";

interface LogoMarkProps {
  variant?: Variant;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Murma's mark — "Cresting Arc": a murmuration of dots gathering into a soft
 * crest, with a few notes lifting free above it (the accent note in signal
 * green). The flock (murmuration) and the rising voice (whisper -> signal)
 * in one mark. Built parametrically from dots so it scales crisply at any
 * size. GEOMETRY is the settled canonical proportion (9 arc dots, 1.1x size,
 * 0.84 fill, 5 lift notes, crest 32) — regenerate public/favicon.svg if these
 * constants ever change.
 */
const GEOMETRY = { arcDots: 9, dotSize: 1.1, fill: 0.84, liftNotes: 5, crestHeight: 32 };

interface Dot {
  x: number;
  y: number;
  r: number;
  accent: boolean;
}

function buildDots({ arcDots, dotSize, fill, liftNotes, crestHeight }: typeof GEOMETRY): Dot[] {
  const cx = 50;
  const spread = 34;
  const baseY = 52 + crestHeight / 2;
  const dots: Dot[] = [];

  for (let i = 0; i < arcDots; i++) {
    const t = arcDots === 1 ? 0.5 : i / (arcDots - 1);
    const x = cx - spread + t * 2 * spread;
    const arc = 1 - Math.pow((t - 0.5) * 2, 2);
    dots.push({ x, y: baseY - arc * crestHeight, r: 0.68 + 0.32 * arc, accent: false });
  }

  const peakY = baseY - crestHeight;
  const miniN = Math.max(liftNotes - 1, 0);
  const miniSpread = spread * 0.3;
  const miniCrest = 3.4;
  const gap = 6;
  const miniY = peakY - gap;
  for (let j = 0; j < miniN; j++) {
    const t = miniN === 1 ? 0.5 : j / (miniN - 1);
    const x = cx - miniSpread + t * 2 * miniSpread;
    const arc = 1 - Math.pow((t - 0.5) * 2, 2);
    dots.push({ x, y: miniY - arc * miniCrest, r: 0.5 + 0.06 * arc, accent: false });
  }
  if (liftNotes > 0) {
    dots.push({ x: cx, y: miniY - miniCrest - gap * 0.8, r: 0.6, accent: true });
  }

  const baseR = 3.0;
  dots.forEach((d) => { d.r = d.r * baseR * dotSize; });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  dots.forEach((d) => {
    minX = Math.min(minX, d.x - d.r);
    maxX = Math.max(maxX, d.x + d.r);
    minY = Math.min(minY, d.y - d.r);
    maxY = Math.max(maxY, d.y + d.r);
  });
  const extent = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = (fill * 100) / extent;
  const ccx = (minX + maxX) / 2;
  const ccy = (minY + maxY) / 2;
  dots.forEach((d) => {
    d.x = 50 + (d.x - ccx) * scale;
    d.y = 50 + (d.y - ccy) * scale;
    d.r = d.r * scale;
  });

  return dots;
}

const DOTS = buildDots(GEOMETRY);

const VARIANTS: Record<Variant, { bg: string | null; base: string; accent: string }> = {
  light:      { bg: null,      base: "#191a1c", accent: "#256b47" },
  dark:       { bg: "#191a1c", base: "#f3f2ee", accent: "#57c98e" },
  solidGreen: { bg: "#256b47", base: "#ffffff", accent: "#bfe6cf" },
  ink:        { bg: "#f6f5f3", base: "#191a1c", accent: "#256b47" },
};

export default function LogoMark({
  variant = "light",
  size = 40,
  className,
  title = "Murma",
}: LogoMarkProps) {
  const v = VARIANTS[variant] ?? VARIANTS.light;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      {v.bg && <rect width="100" height="100" rx="22" fill={v.bg} />}
      {DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x.toFixed(2)}
          cy={d.y.toFixed(2)}
          r={d.r.toFixed(2)}
          fill={d.accent ? v.accent : v.base}
          opacity={d.accent ? 1 : 0.96}
        />
      ))}
    </svg>
  );
}
