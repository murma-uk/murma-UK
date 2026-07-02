// Soft client-side check for negative phrasing.
// We never block — just nudge the user toward a positive framing.

const NEGATIVE_PATTERNS: { pattern: RegExp; hint: string }[] = [
  { pattern: /\b(ban|banned|banning)\b/i, hint: "ban" },
  { pattern: /\b(shut\s*(down|up)|close\s*down)\b/i, hint: "shut down" },
  { pattern: /\b(get\s*rid\s*of|remove|delete|destroy|tear\s*down|demolish)\b/i, hint: "get rid of" },
  { pattern: /\b(stop|prevent|prohibit|forbid)\b/i, hint: "stop" },
  { pattern: /\b(hate|sucks?|terrible|awful|disgusting|worst)\b/i, hint: "negative tone" },
  { pattern: /\b(no\s+more|less\s+of)\b/i, hint: "less of" },
];

export function flagNegativePhrasing(text: string): string | null {
  if (!text || text.length < 4) return null;
  for (const { pattern } of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) {
      return "Murma is for things you'd love to see. Try rephrasing as a wish — what would you like instead?";
    }
  }
  return null;
}
