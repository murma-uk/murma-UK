// Helpers for pretty request URLs: /request/{slug}-{shortId}
// shortId = first 8 chars of the request UUID. We resolve via DB lookup
// so collisions don't break the route.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID_RE = /-([0-9a-f]{8})$/i;

/**
 * Build the canonical path for a request.
 * Falls back to /request/{id} when no slug is available.
 */
export function buildRequestPath(id: string, slug?: string | null): string {
  if (!id) return "/";
  if (!slug) return `/request/${id}`;
  return `/request/${slug}-${id.slice(0, 8)}`;
}

export interface ParsedRequestParam {
  /** Full UUID if the param is a legacy UUID-only link, else null */
  uuid: string | null;
  /** 8-char short id (last hex segment), used to resolve pretty URLs */
  shortId: string | null;
}

/**
 * Parse the :id route param. Accepts both legacy full-UUID links
 * and pretty {slug}-{shortId} links.
 */
export function parseRequestParam(param: string | undefined): ParsedRequestParam {
  if (!param) return { uuid: null, shortId: null };
  if (UUID_RE.test(param)) {
    return { uuid: param.toLowerCase(), shortId: param.slice(0, 8).toLowerCase() };
  }
  const match = param.match(SHORT_ID_RE);
  return { uuid: null, shortId: match ? match[1].toLowerCase() : null };
}
