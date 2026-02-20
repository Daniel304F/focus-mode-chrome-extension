const TRACKER_DEFAULT_BASE_URL = "http://127.0.0.1:4545";
const FLUSH_ALARM = "focusmode-flush";
const RECOMMENDATIONS_ALARM = "focusmode-recommendations";
const MIN_SESSION_MS = 2000;
const MAX_RECENT_SESSIONS = 200;
const MAX_RECOMMENDATIONS = 24;
const ACTIVE_SESSION_KEY = "activeSessionState";

let activeSession = null;

init();

function init() {
  ensureAlarms();
  hydrateActiveSession().then(() => {
    syncWithCurrentlyActiveTab();
    refreshRecommendations(false);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarms();
  syncWithCurrentlyActiveTab();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FLUSH_ALARM) {
    syncWithCurrentlyActiveTab();
    flushPendingSessions();
    return;
  }
  if (alarm.name === RECOMMENDATIONS_ALARM) {
    refreshRecommendations(false);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    maybeBlockTab(tabId, tab.url);
  }

  if (changeInfo.status === "complete" && tab.active) {
    setActiveSessionFromTab(tab, "tab-complete");
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await getTab(activeInfo.tabId);
  if (!tab) {
    return;
  }
  setActiveSessionFromTab(tab, "tab-activated");
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSession && activeSession.tabId === tabId) {
    finalizeActiveSession("tab-removed");
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    finalizeActiveSession("window-blur");
    return;
  }

  const [tab] = await queryTabs({ active: true, windowId });
  if (tab) {
    setActiveSessionFromTab(tab, "window-focus");
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) {
    return;
  }

  if (request.action === "get_popup_data") {
    getPopupData(request.hostname)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (request.action === "refresh_recommendations") {
    refreshRecommendations(true)
      .then((items) => sendResponse({ ok: true, items }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (request.action === "ping_tracker") {
    pingTracker()
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (request.action === "record_manual_unhide") {
    if (request.hostname && request.selector) {
      recordUnhideEvent(request.hostname, request.selector);
    }
    sendResponse({ ok: true });
    return true;
  }
});

function ensureAlarms() {
  chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
  chrome.alarms.create(RECOMMENDATIONS_ALARM, { periodInMinutes: 180 });
}

async function maybeBlockTab(tabId, tabUrl) {
  const currentHost = parseHostname(tabUrl);
  if (!currentHost) {
    return;
  }

  const data = await storageGet(["blockedSites"]);
  const sites = data.blockedSites || [];
  const isBlocked = sites.some((entry) => matchesBlockedHost(currentHost, entry));

  if (!isBlocked) {
    return;
  }

  if (tabUrl.startsWith(chrome.runtime.getURL("blocked.html"))) {
    return;
  }

  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL("blocked.html"),
  });
}

async function setActiveSessionFromTab(tab, reason) {
  if (!tab || !tab.url) {
    return;
  }

  const host = parseHostname(tab.url);
  if (!host || !shouldTrackUrl(tab.url)) {
    await finalizeActiveSession(reason + "-untrackable");
    return;
  }

  if (
    activeSession &&
    activeSession.tabId === tab.id &&
    activeSession.hostname === host
  ) {
    activeSession.lastSeenAt = Date.now();
    await persistActiveSessionState();
    return;
  }

  await finalizeActiveSession(reason + "-switch");

  activeSession = {
    tabId: tab.id,
    windowId: tab.windowId,
    hostname: host,
    url: tab.url,
    title: tab.title || "",
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
  };
  await persistActiveSessionState();
}

async function finalizeActiveSession(reason) {
  if (!activeSession) {
    return;
  }

  const now = Date.now();
  const session = {
    ...activeSession,
    endedAt: now,
    durationMs: Math.max(0, now - activeSession.startedAt),
    reason,
  };

  activeSession = null;
  await storageSet({ [ACTIVE_SESSION_KEY]: null });

  if (session.durationMs < MIN_SESSION_MS) {
    return;
  }

  await persistSessionLocally(session);
  await enqueuePendingSession(session);
  flushPendingSessions();
}

async function persistSessionLocally(session) {
  const data = await storageGet(["pageStats", "recentSessions"]);
  const pageStats = data.pageStats || {};
  const recentSessions = data.recentSessions || [];

  const existing = pageStats[session.hostname] || {
    hostname: session.hostname,
    totalMs: 0,
    visits: 0,
    lastVisitAt: 0,
    lastUrl: session.url,
    lastTitle: session.title || session.hostname,
  };

  existing.totalMs += session.durationMs;
  existing.visits += 1;
  existing.lastVisitAt = session.endedAt;
  existing.lastUrl = session.url;
  existing.lastTitle = session.title || existing.lastTitle;
  pageStats[session.hostname] = existing;

  recentSessions.unshift({
    hostname: session.hostname,
    url: session.url,
    title: session.title || session.hostname,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
  });

  await storageSet({
    pageStats,
    recentSessions: recentSessions.slice(0, MAX_RECENT_SESSIONS),
  });
}

async function enqueuePendingSession(session) {
  const data = await storageGet(["pendingSessions"]);
  const pending = data.pendingSessions || [];
  pending.push(session);
  await storageSet({ pendingSessions: pending.slice(-500) });
}

async function flushPendingSessions() {
  const data = await storageGet(["pendingSessions", "trackerApiBase"]);
  const pending = data.pendingSessions || [];

  if (pending.length === 0) {
    return;
  }

  const trackerApiBase = sanitizeTrackerBase(data.trackerApiBase);
  const stillPending = [];

  for (const session of pending) {
    const ok = await postSessionToTracker(session, trackerApiBase);
    if (!ok) {
      stillPending.push(session);
    }
  }

  await storageSet({ pendingSessions: stillPending });
}

async function postSessionToTracker(session, trackerApiBase) {
  try {
    const response = await fetch(`${trackerApiBase}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function syncWithCurrentlyActiveTab() {
  const [tab] = await queryTabs({ active: true, currentWindow: true });
  if (!tab) {
    await finalizeActiveSession("no-active-tab");
    return;
  }
  await setActiveSessionFromTab(tab, "sync");
}

async function hydrateActiveSession() {
  const data = await storageGet([ACTIVE_SESSION_KEY]);
  const stored = data[ACTIVE_SESSION_KEY];
  if (!stored) {
    return;
  }

  if (Date.now() - stored.startedAt > 1000 * 60 * 60 * 12) {
    await storageSet({ [ACTIVE_SESSION_KEY]: null });
    return;
  }

  activeSession = stored;
}

async function persistActiveSessionState() {
  await storageSet({ [ACTIVE_SESSION_KEY]: activeSession });
}

async function getPopupData(hostname) {
  const data = await storageGet([
    "blockedSites",
    "hiddenElements",
    "pageStats",
    "recentSessions",
    "favoriteSites",
    "siteRecommendations",
    "trackerApiBase",
  ]);

  const blockedSites = (data.blockedSites || []).map((site) => normalizeSite(site));
  const hiddenElements = data.hiddenElements || {};
  const pageStats = data.pageStats || {};
  const favoriteSites = (data.favoriteSites || []).map((site) => normalizeSite(site));
  const recommendations = data.siteRecommendations || {
    updatedAt: 0,
    items: [],
  };

  const sortedStats = Object.values(pageStats)
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 10);
  const trackedSiteCount = Object.keys(pageStats).length;

  const currentHostStats = hostname && pageStats[hostname] ? pageStats[hostname] : null;
  const hiddenForCurrentHost = hostname ? hiddenElements[hostname] || [] : [];
  const trackerStatus = await pingTracker().catch(() => ({ online: false }));

  return {
    blockedSites,
    hiddenForCurrentHost,
    pageStatsTop: sortedStats,
    trackedSiteCount,
    currentHostStats,
    recentSessions: (data.recentSessions || []).slice(0, 12),
    favoriteSites,
    recommendations,
    trackerStatus,
    trackerApiBase: sanitizeTrackerBase(data.trackerApiBase),
    activeSession,
  };
}

async function pingTracker() {
  const data = await storageGet(["trackerApiBase"]);
  const trackerApiBase = sanitizeTrackerBase(data.trackerApiBase);

  try {
    const response = await fetch(`${trackerApiBase}/api/health`);
    if (!response.ok) {
      return { online: false, baseUrl: trackerApiBase };
    }
    const json = await response.json();
    return {
      online: true,
      baseUrl: trackerApiBase,
      dbPath: json.dbPath || "",
      totalSessions: json.totalSessions || 0,
    };
  } catch (error) {
    return { online: false, baseUrl: trackerApiBase };
  }
}

async function refreshRecommendations(forceRefresh) {
  const data = await storageGet([
    "siteRecommendations",
    "pageStats",
    "favoriteSites",
    "blockedSites",
  ]);

  const existing = data.siteRecommendations || { updatedAt: 0, items: [] };
  const needsRefresh =
    forceRefresh || Date.now() - (existing.updatedAt || 0) > 1000 * 60 * 60 * 3;

  if (!needsRefresh) {
    return existing.items || [];
  }

  const pageStats = data.pageStats || {};
  const favoriteSites = data.favoriteSites || [];
  const blockedSites = data.blockedSites || [];

  const visitedHosts = Object.keys(pageStats);
  const interestKeywords = buildInterestKeywords(visitedHosts, favoriteSites);

  if (interestKeywords.length === 0) {
    await storageSet({
      siteRecommendations: {
        updatedAt: Date.now(),
        items: [],
      },
    });
    return [];
  }

  const excluded = new Set([
    ...visitedHosts.map((s) => normalizeSite(s)),
    ...favoriteSites.map((s) => normalizeSite(s)),
    ...blockedSites.map((s) => normalizeSite(s)),
  ]);

  const recommendations = [];
  const seenDomains = new Set();

  for (const keyword of interestKeywords) {
    const items = await fetchClearbitSuggestions(keyword);
    for (const item of items) {
      const domain = normalizeSite(item.domain);
      if (!domain || excluded.has(domain) || seenDomains.has(domain)) {
        continue;
      }

      seenDomains.add(domain);
      recommendations.push({
        domain,
        name: item.name || domain,
        logo: item.logo || "",
        sourceKeyword: keyword,
        score: recommendationScore(keyword, item),
      });

      if (recommendations.length >= MAX_RECOMMENDATIONS) {
        break;
      }
    }

    if (recommendations.length >= MAX_RECOMMENDATIONS) {
      break;
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  const finalItems = recommendations.slice(0, MAX_RECOMMENDATIONS);

  await storageSet({
    siteRecommendations: {
      updatedAt: Date.now(),
      items: finalItems,
    },
  });

  return finalItems;
}

async function fetchClearbitSuggestions(keyword) {
  const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(
    keyword
  )}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    if (!Array.isArray(json)) {
      return [];
    }
    return json
      .filter((entry) => entry && entry.domain)
      .map((entry) => ({
        domain: entry.domain,
        name: entry.name || "",
        logo: entry.logo || "",
      }));
  } catch (error) {
    return [];
  }
}

function buildInterestKeywords(visitedHosts, favoriteSites) {
  const weightMap = new Map();
  const upsert = (keyword, weight) => {
    if (!keyword || keyword.length < 3) {
      return;
    }
    const current = weightMap.get(keyword) || 0;
    weightMap.set(keyword, current + weight);
  };

  for (const site of favoriteSites || []) {
    for (const keyword of keywordsFromHost(site)) {
      upsert(keyword, 4);
    }
  }

  for (const site of visitedHosts || []) {
    for (const keyword of keywordsFromHost(site)) {
      upsert(keyword, 2);
    }
  }

  return [...weightMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
    .slice(0, 8);
}

function keywordsFromHost(hostname) {
  const normalized = normalizeSite(hostname);
  if (!normalized) {
    return [];
  }

  const segments = normalized.replace(/^www\./, "").split(".");
  const core =
    segments.length >= 2 ? segments[segments.length - 2] : segments[0] || "";
  const parts = core.split(/[-_]/).filter(Boolean);

  const out = new Set([core]);
  for (const part of parts) {
    out.add(part);
  }

  return [...out].filter((token) => token.length >= 3);
}

function recommendationScore(keyword, item) {
  const domain = (item.domain || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  let score = 0;

  if (domain.includes(keyword)) {
    score += 2;
  }
  if (name.includes(keyword)) {
    score += 2;
  }
  if (domain.endsWith(".com")) {
    score += 1;
  }

  return score;
}

async function recordUnhideEvent(hostname, selector) {
  const data = await storageGet(["unhideEvents"]);
  const unhideEvents = data.unhideEvents || [];
  unhideEvents.unshift({
    hostname,
    selector,
    at: Date.now(),
  });
  await storageSet({ unhideEvents: unhideEvents.slice(0, 200) });
}

function parseHostname(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch (error) {
    return null;
  }
}

function shouldTrackUrl(rawUrl) {
  if (!rawUrl) {
    return false;
  }

  if (rawUrl.startsWith(chrome.runtime.getURL("blocked.html"))) {
    return false;
  }

  if (
    rawUrl.startsWith("chrome://") ||
    rawUrl.startsWith("edge://") ||
    rawUrl.startsWith("about:") ||
    rawUrl.startsWith("chrome-extension://")
  ) {
    return false;
  }

  return parseHostname(rawUrl) !== null;
}

function normalizeSite(site) {
  if (!site || typeof site !== "string") {
    return "";
  }

  let normalized = site.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (!normalized.includes("://")) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./, "");
  } catch (error) {
    return site.trim().toLowerCase().replace(/^www\./, "").split("/")[0];
  }
}

function matchesBlockedHost(hostname, blockedEntry) {
  const blocked = normalizeSite(blockedEntry);
  if (!blocked) {
    return false;
  }

  if (hostname === blocked) {
    return true;
  }

  return hostname.endsWith(`.${blocked}`);
}

function sanitizeTrackerBase(base) {
  if (typeof base !== "string" || base.trim() === "") {
    return TRACKER_DEFAULT_BASE_URL;
  }
  return base.trim().replace(/\/$/, "");
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

function queryTabs(queryInfo) {
  return new Promise((resolve) => chrome.tabs.query(queryInfo, resolve));
}

function getTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(tab);
    });
  });
}
