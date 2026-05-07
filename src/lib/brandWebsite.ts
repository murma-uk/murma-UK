// Best-guess website URL for a named brand. Pure heuristic — no network call.
// User confirms or overrides in the UI.

export function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function guessBrandWebsite(name: string): string {
  const slug = slugifyBrand(name);
  if (!slug) return "";
  // UK-first heuristic; user can correct.
  return `https://${slug}.co.uk`;
}

const URL_RE =
  /^https?:\/\/([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;

export function isValidWebsiteUrl(url: string): boolean {
  return URL_RE.test(url.trim());
}

export function normaliseWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function displayHostname(url: string): string {
  try {
    return new URL(normaliseWebsiteUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
