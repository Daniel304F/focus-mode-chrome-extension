/**
 * Pure formatting and normalization utilities — no side effects, no Chrome API.
 */

export function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h <= 0 ? `${m}m` : `${h}h ${m}m`;
}

/** Formats milliseconds as MM:SS for countdown displays. */
export function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function normalizeSite(raw) {
  if (!raw || typeof raw !== "string") return "";
  let value = raw.trim().toLowerCase();
  if (!value) return "";
  if (!value.includes("://")) value = `https://${value}`;
  try {
    const { hostname } = new URL(value);
    return hostname ? hostname.replace(/^www\./, "") : "";
  } catch {
    return raw.trim().toLowerCase().replace(/^www\./, "").split("/")[0];
  }
}

export function normalizeSites(sites) {
  if (!Array.isArray(sites)) return [];
  const seen = new Set();
  for (const s of sites) {
    const n = normalizeSite(s);
    if (n) seen.add(n);
  }
  return [...seen];
}

export function parseHostname(rawUrl) {
  try {
    const { protocol, hostname } = new URL(rawUrl);
    if (protocol !== "http:" && protocol !== "https:") return "";
    return hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeHiddenEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        return { id: `legacy_${hashString(entry)}`, selector: entry, label: entry, createdAt: 0 };
      }
      if (!entry || typeof entry.selector !== "string") return null;
      return {
        id: entry.id || `fm_${hashString(entry.selector)}`,
        selector: entry.selector,
        label: entry.label || entry.selector,
        createdAt: Number(entry.createdAt || 0),
      };
    })
    .filter(Boolean);
}

/** Wraps a matched substring in <strong> for autocomplete highlighting. */
export function highlightMatch(value, query) {
  const lv = value.toLowerCase();
  const lq = (query || "").toLowerCase();
  const i = lv.indexOf(lq);
  if (!lq || i < 0) return escapeHtml(value);
  return (
    escapeHtml(value.slice(0, i)) +
    `<strong>${escapeHtml(value.slice(i, i + lq.length))}</strong>` +
    escapeHtml(value.slice(i + lq.length))
  );
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
