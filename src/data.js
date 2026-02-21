/**
 * Data loading: fetches extension data from the background service worker
 * and populates the shared state. Also computes extended stats.
 *
 * FIX: /api/stats/daily returns { ok, days, items: [{day, totalMs, sessions}] }
 *      Previous code was incorrectly reading r.date and r.total_ms.
 */
import { state } from "./state.js";
import { storageGet } from "./lib/chrome.js";
import { sendToRuntime } from "./lib/chrome.js";
import { normalizeSites, normalizeHiddenEntries, toDateStr } from "./lib/format.js";

export async function refreshAllData() {
  const res = await sendToRuntime({ action: "get_popup_data", hostname: state.currentHostname });

  if (res?.ok && res.data) {
    const d = res.data;
    state.blockedSites = normalizeSites(d.blockedSites || []);
    state.hiddenForCurrentHost = normalizeHiddenEntries(d.hiddenForCurrentHost || []);
    state.pageStatsTop = d.pageStatsTop || [];
    state.currentHostStats = d.currentHostStats || null;
    state.favoriteSites = normalizeSites(d.favoriteSites || []);
    state.recommendations = d.recommendations || { items: [], updatedAt: 0 };
    state.trackerStatus = d.trackerStatus || { online: false };
    state.trackerApiBase = d.trackerApiBase || "http://127.0.0.1:4545";
    state.trackedSiteCount = Number(d.trackedSiteCount ?? state.pageStatsTop.length);
    state.activeSession = d.activeSession || null;
  } else {
    // Fallback: read directly from Chrome storage
    const fb = await storageGet([
      "blockedSites", "hiddenElements", "favoriteSites",
      "siteRecommendations", "pageStats", "trackerApiBase",
    ]);
    state.blockedSites = normalizeSites(fb.blockedSites || []);
    state.favoriteSites = normalizeSites(fb.favoriteSites || []);
    state.recommendations = fb.siteRecommendations || { items: [], updatedAt: 0 };
    const pageStats = fb.pageStats || {};
    state.pageStatsTop = Object.values(pageStats).sort((a, b) => b.totalMs - a.totalMs).slice(0, 10);
    state.currentHostStats = pageStats[state.currentHostname] || null;
    state.trackedSiteCount = Object.keys(pageStats).length;
    state.hiddenForCurrentHost = normalizeHiddenEntries(
      (fb.hiddenElements || {})[state.currentHostname] || []
    );
    state.trackerApiBase = fb.trackerApiBase || "http://127.0.0.1:4545";
    state.trackerStatus = { online: false };
  }

  await computeExtendedStats();
  await loadPomodoroState();
}

// ── Extended stats (today / week / 7-day chart) ───────────────────────────────

async function computeExtendedStats() {
  // Prefer SQLite server — only when user has enabled it and server is online
  if (state.sqliteEnabled && state.trackerStatus?.online) {
    try {
      const resp = await fetch(`${state.trackerApiBase}/api/stats/daily?days=7`);
      if (resp.ok) {
        const body = await resp.json();
        // FIX: response is { ok, days, items: [{day, totalMs, sessions}] }
        const rows = body.items || [];
        const todayStr = toDateStr(new Date());

        const rowMap = {};
        let weekMs = 0;
        let todayMs = 0;

        for (const r of rows) {
          const ms = Number(r.totalMs || 0); // FIX: was r.total_ms (wrong)
          rowMap[r.day] = ms;               // FIX: was r.date (wrong)
          weekMs += ms;
          if (r.day === todayStr) todayMs = ms;
        }

        state.todayMs = todayMs;
        state.weekMs = weekMs;
        state.dailyStats = buildDailyArray(rowMap);
        return;
      }
    } catch (_) {
      // fall through to local fallback
    }
  }

  // Fallback: compute from local recentSessions (capped at 200)
  const stored = await storageGet(["recentSessions"]);
  const sessions = stored.recentSessions || [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const weekStartMs = todayStartMs - 6 * 24 * 60 * 60 * 1000;

  let todayMs = 0;
  let weekMs = 0;
  const dayMap = {};

  for (const s of sessions) {
    const ts = Number(s.startedAt || 0);
    const dur = Number(s.durationMs || 0);
    if (!ts || !dur) continue;
    if (ts >= todayStartMs) todayMs += dur;
    if (ts >= weekStartMs) {
      weekMs += dur;
      const key = toDateStr(new Date(ts));
      dayMap[key] = (dayMap[key] || 0) + dur;
    }
  }

  state.todayMs = todayMs;
  state.weekMs = weekMs;
  state.dailyStats = buildDailyArray(dayMap);
}

function buildDailyArray(dayMap) {
  const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = toDateStr(d);
    result.push({ label: i === 0 ? "Heute" : DAY_NAMES[d.getDay()], totalMs: dayMap[key] || 0, isToday: i === 0 });
  }
  return result;
}

// ── Pomodoro state ────────────────────────────────────────────────────────────

export async function loadPomodoroState() {
  const stored = await storageGet(["pomodoroState"]);
  const ps = stored.pomodoroState;
  if (ps) Object.assign(state.pomodoro, ps);
}
