import { cn } from "@/lib/utils";

type Variant = "light" | "dark" | "solidGreen" | "ink";

interface LogoMarkProps {
  variant?: Variant;
  size?: number;
  className?: string;
  title?: string;
}

// Palette
const C = {
  paper: "#f2efe8",
  ink: "#18160f",
  signal: "#1a7a3c",
  pip: "#5a5446",
};

/**
 * "Open Door" brand mark for Hey, Open Up.
 * Door frame with an ajar panel and a knob (signal green) — the gesture of "opening up".
 */
export default function LogoMark({
  variant = "light",
  size = 40,
  className,
  title = "Hey, Open Up",
}: LogoMarkProps) {
  // Each variant defines: bg (or none), frame, panel, knob, inset stroke, spill, pip
  const v = (() => {
    switch (variant) {
      case "dark":
        return {
          bg: C.ink,
          frame: C.paper,
          frameOpacity: 0.08,
          panel: C.signal,
          panelOpacity: 1,
          knob: C.paper,
          inset: C.ink,
          insetOpacity: 0.22,
          spill: C.signal,
          spillOpacity: 0.38,
          pip: C.paper,
          pipOpacity: 0.18,
        };
      case "solidGreen":
        return {
          bg: C.signal,
          frame: C.paper,
          frameOpacity: 0.15,
          panel: C.paper,
          panelOpacity: 0.92,
          knob: C.signal,
          inset: C.signal,
          insetOpacity: 0.3,
          spill: C.paper,
          spillOpacity: 0.12,
          pip: C.paper,
          pipOpacity: 0.25,
        };
      case "ink":
        return {
          bg: C.paper,
          frame: C.ink,
          frameOpacity: 1,
          panel: C.paper,
          panelOpacity: 1,
          knob: C.ink,
          inset: C.ink,
          insetOpacity: 1,
          spill: C.ink,
          spillOpacity: 0.06,
          pip: C.pip,
          pipOpacity: 0.3,
        };
      case "light":
      default:
        return {
          bg: "transparent",
          frame: C.ink,
          frameOpacity: 1,
          panel: C.paper,
          panelOpacity: 1,
          knob: C.signal,
          inset: "#c8c3b5",
          insetOpacity: 1,
          spill: C.signal,
          spillOpacity: 0.09,
          pip: C.pip,
          pipOpacity: 0.35,
        };
    }
  })();

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
      {variant !== "light" && (
        <rect width="100" height="100" rx="14" fill={v.bg} />
      )}
      {/* Frame */}
      <rect
        x="26"
        y="14"
        width="44"
        height="72"
        rx="2"
        fill={v.frame}
        opacity={v.frameOpacity}
      />
      {/* Panel ajar */}
      <polygon
        points="30,18 64,21 64,82 30,79"
        fill={v.panel}
        opacity={v.panelOpacity}
      />
      {/* Insets */}
      <rect
        x="35"
        y="25"
        width="24"
        height="18"
        rx="0.8"
        fill="none"
        stroke={v.inset}
        strokeOpacity={v.insetOpacity}
        strokeWidth="1.2"
      />
      <rect
        x="35"
        y="48"
        width="24"
        height="26"
        rx="0.8"
        fill="none"
        stroke={v.inset}
        strokeOpacity={v.insetOpacity}
        strokeWidth="1.2"
      />
      {/* Knob */}
      <circle cx="60" cy="52" r="2.6" fill={v.knob} />
      {/* Light spill */}
      <polygon
        points="64,21 78,14 78,82 64,82"
        fill={v.spill}
        opacity={v.spillOpacity}
      />
      {/* Hinge pips */}
      <rect
        x="26"
        y="25"
        width="5"
        height="3.5"
        rx="0.6"
        fill={v.pip}
        opacity={v.pipOpacity}
      />
      <rect
        x="26"
        y="69"
        width="5"
        height="3.5"
        rx="0.6"
        fill={v.pip}
        opacity={v.pipOpacity}
      />
    </svg>
  );
}
