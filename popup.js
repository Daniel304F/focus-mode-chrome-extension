// ── Translations ─────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  de: {
    navBlocker: "Blocker",
    navElemente: "Elemente",
    navStatistik: "Statistik",
    navEmpfehlungen: "Tipps",
    navEinstellungen: "Setup",
    blockerTitle: "Seiten blockieren",
    blockerPlaceholder: "Domain, z. B. reddit.com",
    blockerAddBtn: "Block",
    elementeTitle: "Elemente verstecken",
    elementePickerBtn: "Auswahl starten",
    elementeManageBtn: "Verwalten",
    elementeResetBtn: "Alle zurücksetzen",
    statsTitle: "Übersicht",
    statsTrackedSites: "Getrackte Seiten",
    statsToday: "Heute gesamt",
    statsWeek: "Diese Woche",
    statsTopSites: "Top-Seiten",
    statsLast7Days: "Letzte 7 Tage",
    recsTitle: "Empfehlungen",
    recsReloadBtn: "Neu laden",
    setupServerTitle: "Server-Verbindung",
    setupSaveBtn: "Speichern",
    setupReconnectBtn: "Verbinden",
    setupAppearanceTitle: "Darstellung",
    setupThemeDark: "🌙 Dunkel",
    setupThemeLight: "☀️ Hell",
    setupLangBtn: "🇬🇧 English",
    setupLlmTitle: "KI-Zusammenfassung",
    setupLlmKeyLabel: "API-Key",
    setupLlmKeyPlaceholder: "Anthropic API-Key (sk-ant-...)",
    setupLlmBtn: "📊 Daten zusammenfassen",
    setupLlmLoading: "Analysiere Daten…",
    reconnectOk: "✓ Verbunden",
    reconnectErr: "✗ Offline",
    reconnectTrying: "Verbinde…",
    llmErrNoKey: "Bitte zuerst einen Anthropic API-Key eingeben.",
    llmErrNoData: "Noch keine Browsing-Daten vorhanden.",
    llmErrNetwork: "Netzwerkfehler beim Aufruf der API.",
    llmPromptIntro: "Analysiere diese Browser-Statistiken kurz und gib 2–3 konkrete Produktivitäts-Tipps (max. 150 Wörter, auf Deutsch):",
  },
  en: {
    navBlocker: "Blocker",
    navElemente: "Elements",
    navStatistik: "Stats",
    navEmpfehlungen: "Tips",
    navEinstellungen: "Setup",
    blockerTitle: "Block Sites",
    blockerPlaceholder: "Domain, e.g. reddit.com",
    blockerAddBtn: "Block",
    elementeTitle: "Hide Elements",
    elementePickerBtn: "Start Selection",
    elementeManageBtn: "Manage",
    elementeResetBtn: "Reset All",
    statsTitle: "Overview",
    statsTrackedSites: "Tracked Sites",
    statsToday: "Today Total",
    statsWeek: "This Week",
    statsTopSites: "Top Sites",
    statsLast7Days: "Last 7 Days",
    recsTitle: "Recommendations",
    recsReloadBtn: "Refresh",
    setupServerTitle: "Server Connection",
    setupSaveBtn: "Save",
    setupReconnectBtn: "Connect",
    setupAppearanceTitle: "Appearance",
    setupThemeDark: "🌙 Dark",
    setupThemeLight: "☀️ Light",
    setupLangBtn: "🇩🇪 Deutsch",
    setupLlmTitle: "AI Summary",
    setupLlmKeyLabel: "API Key",
    setupLlmKeyPlaceholder: "Anthropic API Key (sk-ant-...)",
    setupLlmBtn: "📊 Summarize Data",
    setupLlmLoading: "Analyzing data…",
    reconnectOk: "✓ Connected",
    reconnectErr: "✗ Offline",
    reconnectTrying: "Connecting…",
    llmErrNoKey: "Please enter an Anthropic API key first.",
    llmErrNoData: "No browsing data available yet.",
    llmErrNetwork: "Network error calling the API.",
    llmPromptIntro: "Briefly analyze these browsing statistics and give 2–3 concrete productivity tips (max. 150 words, in English):",
  },
};

// ── Static suggestions ────────────────────────────────────────────────────────

const STATIC_SUGGESTIONS = [
  "youtube.com", "facebook.com", "instagram.com", "x.com", "twitter.com",
  "reddit.com", "tiktok.com", "linkedin.com", "netflix.com", "twitch.tv",
  "pinterest.com", "amazon.com", "wikipedia.org", "bild.de", "spiegel.de",
  "zeit.de", "welt.de", "ebay.de", "kleinanzeigen.de", "paypal.com",
  "gmx.net", "web.de", "t-online.de", "focus.de", "chip.de",
  "tagesschau.de", "whatsapp.com", "discord.com", "bing.com", "duckduckgo.com",
  "booking.com", "immobilienscout24.de", "mobile.de", "chefkoch.de", "wetter.com",
  "9gag.com", "tumblr.com", "quora.com", "stackoverflow.com", "github.com",
  "gitlab.com", "openai.com", "notion.so", "figma.com", "asana.com",
  "trello.com", "cnn.com", "bbc.com", "nytimes.com", "medium.com",
  "substack.com", "hackernews.com", "news.ycombinator.com", "producthunt.com",
  "imdb.com", "spotify.com", "soundcloud.com", "udemy.com", "coursera.org",
  "edx.org", "khanacademy.org", "fiverr.com", "upwork.com", "airbnb.com",
  "tripadvisor.com", "skyscanner.com", "kayak.com", "canva.com", "dribbble.com",
  "behance.net", "slack.com", "zoom.us", "teams.microsoft.com", "dropbox.com",
  "drive.google.com", "maps.google.com", "finance.yahoo.com", "investing.com",
  "tradingview.com", "coinmarketcap.com", "binance.com", "kraken.com",
  "stripe.com", "shopify.com", "etsy.com", "zalando.de", "otto.de",
  "heise.de", "computerbild.de", "n-tv.de", "kicker.de", "transfermarkt.de",
  "xing.com", "xing.de", "researchgate.net", "arxiv.org", "deepl.com",
  "translate.google.com", "duck.ai", "claude.ai",
];

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  currentTab: null,
  currentHostname: "",
  blockedSites: [],
  hiddenForCurrentHost: [],
  pageStatsTop: [],
  currentHostStats: null,
  favoriteSites: [],
  recommendations: { items: [], updatedAt: 0 },
  trackerStatus: { online: false, baseUrl: "http://127.0.0.1:4545" },
  trackerApiBase: "http://127.0.0.1:4545",
  trackedSiteCount: 0,
  activeSession: null,
  todayMs: 0,
  weekMs: 0,
  dailyStats: [],
  // Settings
  uiTheme: "light",
  uiLanguage: "de",
};

const ui = {};
let autocompleteState = { index: -1, options: [] };

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  await initSettings();
  bindEvents();
  await loadCurrentTab();
  await refreshAllData();
  setInterval(renderLiveActiveTime, 1000);
});

function cacheElements() {
  // Blocker
  ui.siteInput = document.getElementById("siteInput");
  ui.addBtn = document.getElementById("addBtn");
  ui.blockList = document.getElementById("blockList");
  ui.blockedCountLabel = document.getElementById("blockedCountLabel");
  // Elemente
  ui.hiddenCountLabel = document.getElementById("hiddenCountLabel");
  ui.pickerBtn = document.getElementById("picker-btn");
  ui.manageBtn = document.getElementById("manage-btn");
  ui.resetAllBtn = document.getElementById("reset-all-btn");
  ui.hiddenElementList = document.getElementById("hiddenElementList");
  // Header
  ui.currentHostLabel = document.getElementById("currentHostLabel");
  ui.trackerStatusChip = document.getElementById("trackerStatusChip");
  // Stats
  ui.currentHostTimeValue = document.getElementById("currentHostTimeValue");
  ui.currentHostTimeLabel = document.getElementById("currentHostTimeLabel");
  ui.trackedSitesValue = document.getElementById("trackedSitesValue");
  ui.todayTimeValue = document.getElementById("todayTimeValue");
  ui.weekTimeValue = document.getElementById("weekTimeValue");
  ui.topStatsList = document.getElementById("topStatsList");
  ui.topSitesCountLabel = document.getElementById("topSitesCountLabel");
  ui.dailyCard = document.getElementById("dailyCard");
  ui.dailyChart = document.getElementById("dailyChart");
  ui.weekTotalLabel = document.getElementById("weekTotalLabel");
  // Empfehlungen
  ui.recommendationList = document.getElementById("recommendationList");
  ui.refreshRecommendationsBtn = document.getElementById("refreshRecommendationsBtn");
  // Setup
  ui.trackerUrlInput = document.getElementById("trackerUrlInput");
  ui.saveTrackerUrlBtn = document.getElementById("saveTrackerUrlBtn");
  ui.reconnectBtn = document.getElementById("reconnectBtn");
  ui.reconnectStatus = document.getElementById("reconnectStatus");
  ui.themeBtn = document.getElementById("themeBtn");
  ui.langBtn = document.getElementById("langBtn");
  ui.apiKeyInput = document.getElementById("apiKeyInput");
  ui.toggleApiKeyBtn = document.getElementById("toggleApiKeyBtn");
  ui.summarizeBtn = document.getElementById("summarizeBtn");
  ui.summaryResult = document.getElementById("summaryResult");
}

function bindEvents() {
  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
  // Blocker
  ui.addBtn.addEventListener("click", () => addSiteFromInput());
  ui.siteInput.addEventListener("keydown", onInputKeyDown);
  ui.siteInput.addEventListener("input", onInputChanged);
  // Elemente
  ui.pickerBtn.addEventListener("click", () => sendToTabAndClose("start_selection"));
  ui.manageBtn.addEventListener("click", () => sendToTabAndClose("toggle_manage"));
  ui.resetAllBtn.addEventListener("click", resetHiddenForCurrentHost);
  // Empfehlungen
  ui.refreshRecommendationsBtn.addEventListener("click", refreshRecommendations);
  // Setup
  ui.saveTrackerUrlBtn.addEventListener("click", saveTrackerUrl);
  ui.reconnectBtn.addEventListener("click", reconnectTracker);
  ui.themeBtn.addEventListener("click", toggleTheme);
  ui.langBtn.addEventListener("click", toggleLanguage);
  ui.apiKeyInput.addEventListener("blur", saveApiKey);
  ui.toggleApiKeyBtn.addEventListener("click", () => {
    const isPassword = ui.apiKeyInput.type === "password";
    ui.apiKeyInput.type = isPassword ? "text" : "password";
    ui.toggleApiKeyBtn.textContent = isPassword ? "🙈" : "👁";
  });
  ui.summarizeBtn.addEventListener("click", summarizeData);
  // Close autocomplete on outside click
  document.addEventListener("click", (event) => closeAutocomplete(event.target));
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function initSettings() {
  const stored = await storageGet(["uiTheme", "uiLanguage", "anthropicApiKey"]);
  state.uiTheme = stored.uiTheme || "light";
  state.uiLanguage = stored.uiLanguage || "de";

  applyTheme(state.uiTheme);
  applyLanguage(state.uiLanguage);

  if (stored.anthropicApiKey) {
    ui.apiKeyInput.value = stored.anthropicApiKey;
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const t = TRANSLATIONS[state.uiLanguage] || TRANSLATIONS.de;
  ui.themeBtn.textContent = theme === "dark" ? t.setupThemeLight : t.setupThemeDark;
}

async function toggleTheme() {
  state.uiTheme = state.uiTheme === "dark" ? "light" : "dark";
  applyTheme(state.uiTheme);
  await storageSet({ uiTheme: state.uiTheme });
}

function applyLanguage(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.de;

  // Update all data-i18n elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Update placeholders
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.dataset.i18nPh;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Update dynamic buttons that aren't purely data-i18n
  ui.langBtn.textContent = t.setupLangBtn;
  ui.themeBtn.textContent = state.uiTheme === "dark" ? t.setupThemeLight : t.setupThemeDark;
}

async function toggleLanguage() {
  state.uiLanguage = state.uiLanguage === "de" ? "en" : "de";
  applyLanguage(state.uiLanguage);
  await storageSet({ uiLanguage: state.uiLanguage });
}

async function saveApiKey() {
  const key = ui.apiKeyInput.value.trim();
  await storageSet({ anthropicApiKey: key });
}

// ── Reconnect ─────────────────────────────────────────────────────────────────

async function reconnectTracker() {
  const t = TRANSLATIONS[state.uiLanguage] || TRANSLATIONS.de;
  ui.reconnectBtn.disabled = true;
  ui.reconnectBtn.textContent = t.reconnectTrying;
  ui.reconnectStatus.textContent = "";

  const ping = await runtimeMessage({ action: "ping_tracker" }).catch(() => null);
  const ok = ping?.ok && ping?.status?.online;

  if (ok) {
    state.trackerStatus = ping.status;
    ui.reconnectStatus.style.color = "var(--ok)";
    ui.reconnectStatus.textContent = t.reconnectOk;
    renderTrackerChip();
  } else {
    ui.reconnectStatus.style.color = "var(--warning)";
    ui.reconnectStatus.textContent = t.reconnectErr;
  }

  ui.reconnectBtn.textContent = t.setupReconnectBtn;
  ui.reconnectBtn.disabled = false;

  // Clear status text after 3 seconds
  setTimeout(() => {
    ui.reconnectStatus.textContent = "";
  }, 3000);
}

// ── LLM Summary ───────────────────────────────────────────────────────────────

async function summarizeData() {
  const t = TRANSLATIONS[state.uiLanguage] || TRANSLATIONS.de;
  const apiKey = ui.apiKeyInput.value.trim();

  if (!apiKey) {
    showSummary(t.llmErrNoKey, "error");
    return;
  }

  if (!state.pageStatsTop || state.pageStatsTop.length === 0) {
    showSummary(t.llmErrNoData, "error");
    return;
  }

  ui.summarizeBtn.disabled = true;
  showSummary(t.setupLlmLoading, "loading");

  const prompt = buildLlmPrompt(t);

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      showSummary(`API Error ${resp.status}: ${err?.error?.message || resp.statusText}`, "error");
      return;
    }

    const data = await resp.json();
    const text = data?.content?.[0]?.text || "Keine Antwort erhalten.";
    showSummary(text, "ok");
  } catch (err) {
    showSummary(t.llmErrNetwork, "error");
  } finally {
    ui.summarizeBtn.disabled = false;
  }
}

function buildLlmPrompt(t) {
  const top5 = state.pageStatsTop.slice(0, 5);
  const topLines = top5
    .map((s, i) => `  ${i + 1}. ${s.hostname} — ${formatDuration(s.totalMs || 0)} (${s.visits || 0}×)`)
    .join("\n");

  return [
    t.llmPromptIntro,
    "",
    `Heute: ${formatDuration(state.todayMs)}`,
    `Diese Woche: ${formatDuration(state.weekMs)}`,
    `Getrackte Seiten: ${state.trackedSiteCount}`,
    `Blockierte Seiten: ${state.blockedSites.length}`,
    `Top-Seiten:`,
    topLines,
  ].join("\n");
}

function showSummary(text, type) {
  ui.summaryResult.style.display = "";
  ui.summaryResult.className = `summary-box${type !== "ok" ? ` ${type}` : ""}`;
  ui.summaryResult.textContent = text;
}

// ── Navigation ────────────────────────────────────────────────────────────────

function showPage(pageId) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === `page-${pageId}`);
  });
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadCurrentTab() {
  const [tab] = await queryTabs({ active: true, currentWindow: true });
  state.currentTab = tab || null;
  state.currentHostname = tab && tab.url ? parseHostname(tab.url) : "";
  ui.currentHostLabel.textContent = `Aktive Seite: ${state.currentHostname || "nicht verfügbar"}`;
}

async function refreshAllData() {
  const popupResponse = await runtimeMessage({
    action: "get_popup_data",
    hostname: state.currentHostname,
  });

  if (popupResponse?.ok && popupResponse.data) {
    const data = popupResponse.data;
    state.blockedSites = normalizeSites(data.blockedSites || []);
    state.hiddenForCurrentHost = normalizeHiddenEntries(data.hiddenForCurrentHost || []);
    state.pageStatsTop = data.pageStatsTop || [];
    state.currentHostStats = data.currentHostStats || null;
    state.favoriteSites = normalizeSites(data.favoriteSites || []);
    state.recommendations = data.recommendations || { items: [], updatedAt: 0 };
    state.trackerStatus = data.trackerStatus || { online: false };
    state.trackerApiBase = data.trackerApiBase || "http://127.0.0.1:4545";
    state.trackedSiteCount = Number(data.trackedSiteCount || state.pageStatsTop.length);
    state.activeSession = data.activeSession || null;
  } else {
    const fallback = await storageGet([
      "blockedSites", "hiddenElements", "favoriteSites",
      "siteRecommendations", "pageStats", "trackerApiBase",
    ]);
    state.blockedSites = normalizeSites(fallback.blockedSites || []);
    state.favoriteSites = normalizeSites(fallback.favoriteSites || []);
    state.recommendations = fallback.siteRecommendations || { items: [], updatedAt: 0 };
    const pageStats = fallback.pageStats || {};
    state.pageStatsTop = Object.values(pageStats).sort((a, b) => b.totalMs - a.totalMs).slice(0, 10);
    state.currentHostStats = pageStats[state.currentHostname] || null;
    state.trackedSiteCount = Object.keys(pageStats).length;
    const hiddenMap = fallback.hiddenElements || {};
    state.hiddenForCurrentHost = normalizeHiddenEntries(hiddenMap[state.currentHostname] || []);
    state.trackerApiBase = fallback.trackerApiBase || "http://127.0.0.1:4545";
    state.trackerStatus = { online: false, baseUrl: state.trackerApiBase };
  }

  await computeExtendedStats();
  ui.trackerUrlInput.value = state.trackerApiBase;
  renderAll();
}

// ── Extended stats ────────────────────────────────────────────────────────────

async function computeExtendedStats() {
  // Try SQLite first (more accurate for long-term users)
  if (state.trackerStatus?.online) {
    try {
      const resp = await fetch(`${state.trackerApiBase}/api/stats/daily?days=7`);
      if (resp.ok) {
        const rows = await resp.json();
        const todayStr = toDateStr(new Date());
        let todayMs = 0;
        let weekMs = 0;
        const rowMap = {};
        for (const r of rows) {
          rowMap[r.date] = Number(r.total_ms || 0);
          weekMs += Number(r.total_ms || 0);
          if (r.date === todayStr) todayMs = Number(r.total_ms || 0);
        }
        state.todayMs = todayMs;
        state.weekMs = weekMs;
        state.dailyStats = buildDailyStats(rowMap);
        return;
      }
    } catch (_) { /* fall through */ }
  }

  // Fallback: local recentSessions
  const stored = await storageGet(["recentSessions"]);
  const sessions = stored.recentSessions || [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const weekStartMs = todayMs - 6 * 24 * 60 * 60 * 1000;

  let todayTotal = 0;
  let weekTotal = 0;
  const dayMap = {};

  for (const s of sessions) {
    const ts = Number(s.startedAt || s.started_at || 0);
    const dur = Number(s.durationMs || s.duration_ms || 0);
    if (!ts || !dur) continue;
    if (ts >= todayMs) todayTotal += dur;
    if (ts >= weekStartMs) {
      weekTotal += dur;
      const d = new Date(ts);
      const key = toDateStr(d);
      dayMap[key] = (dayMap[key] || 0) + dur;
    }
  }

  state.todayMs = todayTotal;
  state.weekMs = weekTotal;
  state.dailyStats = buildDailyStats(dayMap);
}

function buildDailyStats(dayMap) {
  const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = toDateStr(d);
    result.push({
      label: i === 0 ? "Heute" : DAY_NAMES[d.getDay()],
      totalMs: dayMap[key] || 0,
      isToday: i === 0,
    });
  }
  return result;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAll() {
  renderTrackerChip();
  renderBlockedSites();
  renderHiddenElements();
  renderStats();
  renderRecommendations();
  renderLiveActiveTime();
}

function renderTrackerChip() {
  const online = Boolean(state.trackerStatus?.online);
  ui.trackerStatusChip.classList.remove("ok", "err");
  ui.trackerStatusChip.classList.add(online ? "ok" : "err");
  ui.trackerStatusChip.textContent = online
    ? `SQLite: online (${state.trackerStatus.totalSessions || 0})`
    : "SQLite: offline";
}

function renderBlockedSites() {
  ui.blockList.innerHTML = "";
  ui.blockedCountLabel.textContent = `${state.blockedSites.length} geblockt`;

  if (state.blockedSites.length === 0) {
    ui.blockList.innerHTML = `<li class="item"><div class="item-main"><div class="item-sub">Noch keine blockierten Seiten.</div></div></li>`;
    return;
  }

  for (const site of state.blockedSites) {
    const isFavorite = state.favoriteSites.includes(site);
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(site)}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn star ${isFavorite ? "active" : ""}" title="Favorit">★</button>
        <button class="icon-btn remove" title="Entfernen">✕</button>
      </div>
    `;
    li.querySelector(".star").addEventListener("click", async () => toggleFavoriteSite(site));
    li.querySelector(".remove").addEventListener("click", async () => removeBlockedSite(site));
    ui.blockList.appendChild(li);
  }
}

function renderHiddenElements() {
  ui.hiddenElementList.innerHTML = "";
  ui.hiddenCountLabel.textContent = `${state.hiddenForCurrentHost.length} Elemente`;

  if (!state.currentHostname) {
    ui.hiddenElementList.innerHTML = `<li class="item"><div class="item-main"><div class="item-sub">Auf dieser Seite ist kein Element-Picker verfügbar.</div></div></li>`;
    return;
  }

  if (state.hiddenForCurrentHost.length === 0) {
    ui.hiddenElementList.innerHTML = `<li class="item"><div class="item-main"><div class="item-sub">Keine ausgeblendeten Elemente auf ${escapeHtml(state.currentHostname)}.</div></div></li>`;
    return;
  }

  for (const entry of state.hiddenForCurrentHost) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(entry.label || entry.selector)}</div>
        <div class="item-sub">${escapeHtml(entry.selector)}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn restore" title="Wiederherstellen">↺</button>
      </div>
    `;
    li.querySelector(".restore").addEventListener("click", async () => unhideEntry(entry));
    ui.hiddenElementList.appendChild(li);
  }
}

function renderStats() {
  const baseMs = Number(state.currentHostStats?.totalMs || 0);
  ui.currentHostTimeValue.textContent = formatDuration(baseMs);
  ui.currentHostTimeLabel.textContent = state.currentHostname || "Aktive Domain";
  ui.trackedSitesValue.textContent = String(state.trackedSiteCount || 0);
  ui.todayTimeValue.textContent = formatDuration(state.todayMs || 0);
  ui.weekTimeValue.textContent = formatDuration(state.weekMs || 0);

  // Top sites with progress bars
  ui.topStatsList.innerHTML = "";
  if (!state.pageStatsTop || state.pageStatsTop.length === 0) {
    ui.topStatsList.innerHTML = `<div class="item"><div class="item-main"><div class="item-sub">Noch keine Tracking-Daten vorhanden.</div></div></div>`;
    ui.topSitesCountLabel.textContent = "";
  } else {
    const top = state.pageStatsTop.slice(0, 10);
    const maxMs = top[0]?.totalMs || 1;
    ui.topSitesCountLabel.textContent = `${top.length} Seiten`;
    for (const entry of top) {
      const pct = Math.max(3, Math.round((entry.totalMs / maxMs) * 100));
      const div = document.createElement("div");
      div.className = "bar-item";
      div.innerHTML = `
        <div class="bar-top">
          <span class="bar-name">${escapeHtml(entry.hostname)}</span>
          <span class="bar-meta">${formatDuration(entry.totalMs || 0)} · ${entry.visits || 0}×</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      `;
      ui.topStatsList.appendChild(div);
    }
  }

  renderDailyChart();
}

function renderDailyChart() {
  const days = state.dailyStats;
  if (!days || days.length === 0 || !days.some((d) => d.totalMs > 0)) {
    ui.dailyCard.style.display = "none";
    return;
  }
  ui.dailyCard.style.display = "";
  const maxMs = Math.max(...days.map((d) => d.totalMs), 1);
  const weekTotal = days.reduce((sum, d) => sum + d.totalMs, 0);
  ui.weekTotalLabel.textContent = `Gesamt: ${formatDuration(weekTotal)}`;
  ui.dailyChart.innerHTML = "";
  for (const day of days) {
    const heightPct = Math.max(3, Math.round((day.totalMs / maxMs) * 100));
    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-bar" style="height:${heightPct}%" title="${formatDuration(day.totalMs)}"></div>
      <div class="day-label${day.isToday ? " today" : ""}">${escapeHtml(day.label)}</div>
    `;
    ui.dailyChart.appendChild(col);
  }
}

function renderLiveActiveTime() {
  if (!state.currentHostname) return;
  let total = Number(state.currentHostStats?.totalMs || 0);
  if (
    state.activeSession &&
    state.activeSession.hostname === state.currentHostname &&
    state.activeSession.startedAt
  ) {
    total += Math.max(0, Date.now() - Number(state.activeSession.startedAt));
  }
  ui.currentHostTimeValue.textContent = formatDuration(total);
}

function renderRecommendations() {
  const recommendations = state.recommendations?.items || [];
  ui.recommendationList.innerHTML = "";

  if (recommendations.length === 0) {
    ui.recommendationList.innerHTML = `<li class="item"><div class="item-main"><div class="item-sub">Keine Empfehlungen verfügbar. Nutze die Erweiterung etwas länger und lade neu.</div></div></li>`;
    return;
  }

  for (const recommendation of recommendations.slice(0, 12)) {
    const domain = normalizeSite(recommendation.domain);
    const isBlocked = state.blockedSites.includes(domain);
    const isFavorite = state.favoriteSites.includes(domain);
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(recommendation.name || domain)}</div>
        <div class="item-sub">${escapeHtml(domain)} · Interesse: ${escapeHtml(recommendation.sourceKeyword || "allgemein")}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn star ${isFavorite ? "active" : ""}" title="Favorit">★</button>
        <button class="icon-btn block" title="Blockieren">${isBlocked ? "✓" : "⛔"}</button>
      </div>
    `;
    li.querySelector(".star").addEventListener("click", async () => toggleFavoriteSite(domain));
    li.querySelector(".block").addEventListener("click", async () => {
      if (!isBlocked) await addBlockedSite(domain);
    });
    ui.recommendationList.appendChild(li);
  }
}

// ── Autocomplete ──────────────────────────────────────────────────────────────

function onInputChanged() {
  const query = ui.siteInput.value.trim().toLowerCase();
  if (!query) { closeAutocomplete(); return; }
  autocompleteState.options = buildAutocompleteOptions(query).slice(0, 12);
  autocompleteState.index = -1;
  renderAutocomplete();
}

function onInputKeyDown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (autocompleteState.options.length > 0 && autocompleteState.index >= 0) {
      const selected = autocompleteState.options[autocompleteState.index];
      if (selected) ui.siteInput.value = selected.domain;
    }
    addSiteFromInput();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!autocompleteState.options.length) return;
    autocompleteState.index = (autocompleteState.index + 1) % autocompleteState.options.length;
    renderAutocomplete();
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!autocompleteState.options.length) return;
    autocompleteState.index =
      (autocompleteState.index - 1 + autocompleteState.options.length) %
      autocompleteState.options.length;
    renderAutocomplete();
  }
}

function buildAutocompleteOptions(query) {
  const weighted = new Map();
  const insert = (domain, source, baseScore) => {
    const normalized = normalizeSite(domain);
    if (!normalized) return;
    const text = normalized.toLowerCase();
    if (!text.includes(query)) return;
    let score = baseScore + (text.startsWith(query) ? 100 : 55);
    score += Math.max(0, 20 - Math.abs(text.length - query.length));
    const existing = weighted.get(normalized);
    if (!existing || score > existing.score) {
      weighted.set(normalized, { domain: normalized, source, score });
    }
  };
  for (const s of STATIC_SUGGESTIONS) insert(s, "Top", 10);
  for (const s of state.blockedSites) insert(s, "Geblockt", 40);
  for (const s of state.favoriteSites) insert(s, "Favorit", 60);
  for (const r of state.pageStatsTop) insert(r.hostname, "Besucht", 50);
  for (const r of state.recommendations?.items || []) insert(r.domain, "Empfehlung", 35);
  return [...weighted.values()].sort((a, b) => b.score - a.score);
}

function renderAutocomplete() {
  closeAutocomplete();
  if (!autocompleteState.options.length) return;
  const container = document.createElement("div");
  container.className = "autocomplete-items";
  container.id = "siteInput-autocomplete";
  autocompleteState.options.forEach((option, index) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    if (index === autocompleteState.index) item.classList.add("active");
    item.innerHTML = `${highlightMatch(option.domain, ui.siteInput.value.trim())} <small>(${escapeHtml(option.source)})</small>`;
    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
      ui.siteInput.value = option.domain;
      closeAutocomplete();
      addSiteFromInput();
    });
    container.appendChild(item);
  });
  ui.siteInput.parentElement.appendChild(container);
}

function closeAutocomplete(target) {
  const list = document.getElementById("siteInput-autocomplete");
  if (!list) return;
  if (target && (target === ui.siteInput || list.contains(target) || target.closest?.(".autocomplete-items"))) return;
  list.remove();
}

// ── Data mutations ────────────────────────────────────────────────────────────

async function addSiteFromInput() {
  const site = normalizeSite(ui.siteInput.value);
  if (!site) return;
  await addBlockedSite(site);
  ui.siteInput.value = "";
  autocompleteState = { index: -1, options: [] };
  closeAutocomplete();
}

async function addBlockedSite(site) {
  const normalized = normalizeSite(site);
  if (!normalized) return;
  const result = await storageGet(["blockedSites"]);
  const sites = normalizeSites(result.blockedSites || []);
  if (!sites.includes(normalized)) {
    sites.push(normalized);
    await storageSet({ blockedSites: sites });
  }
  await refreshAllData();
}

async function removeBlockedSite(site) {
  const normalized = normalizeSite(site);
  const result = await storageGet(["blockedSites"]);
  const sites = normalizeSites(result.blockedSites || []).filter((s) => s !== normalized);
  await storageSet({ blockedSites: sites });
  await refreshAllData();
}

async function toggleFavoriteSite(site) {
  const normalized = normalizeSite(site);
  const result = await storageGet(["favoriteSites"]);
  const favorites = normalizeSites(result.favoriteSites || []);
  const next = favorites.includes(normalized)
    ? favorites.filter((e) => e !== normalized)
    : [...favorites, normalized];
  await storageSet({ favoriteSites: next });
  await refreshAllData();
}

async function unhideEntry(entry) {
  if (!state.currentHostname || !entry) return;
  const result = await storageGet(["hiddenElements"]);
  const allHidden = result.hiddenElements || {};
  const list = normalizeHiddenEntries(allHidden[state.currentHostname] || []);
  const filtered = list.filter((item) =>
    entry.id ? item.id !== entry.id : item.selector !== entry.selector
  );
  if (filtered.length === 0) {
    delete allHidden[state.currentHostname];
  } else {
    allHidden[state.currentHostname] = filtered;
  }
  await storageSet({ hiddenElements: allHidden });
  if (state.currentTab?.id) {
    await tabMessage(state.currentTab.id, { action: "remove_hidden_selector", selector: entry.selector, id: entry.id }).catch(() => null);
    await tabMessage(state.currentTab.id, { action: "refresh_hidden_elements" }).catch(() => null);
  }
  await refreshAllData();
}

async function resetHiddenForCurrentHost() {
  if (!state.currentHostname) return;
  const shouldReset = confirm(`Alle versteckten Elemente auf ${state.currentHostname} wiederherstellen?`);
  if (!shouldReset) return;
  const result = await storageGet(["hiddenElements"]);
  const allHidden = result.hiddenElements || {};
  delete allHidden[state.currentHostname];
  await storageSet({ hiddenElements: allHidden });
  if (state.currentTab?.id) {
    await tabMessage(state.currentTab.id, { action: "refresh_hidden_elements" }).catch(() => null);
  }
  await refreshAllData();
}

async function sendToTabAndClose(action) {
  if (!state.currentTab?.id) return;
  await tabMessage(state.currentTab.id, { action }).catch(() => null);
  window.close();
}

async function refreshRecommendations() {
  await runtimeMessage({ action: "refresh_recommendations" }).catch(() => null);
  await refreshAllData();
}

async function saveTrackerUrl() {
  const value = (ui.trackerUrlInput.value || "").trim();
  if (!value) return;
  await storageSet({ trackerApiBase: value.replace(/\/$/, "") });
  const ping = await runtimeMessage({ action: "ping_tracker" }).catch(() => null);
  if (ping?.ok && ping.status) state.trackerStatus = ping.status;
  await refreshAllData();
}

// ── Utility ───────────────────────────────────────────────────────────────────

function normalizeHiddenEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => {
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
  }).filter(Boolean);
}

function normalizeSites(sites) {
  if (!Array.isArray(sites)) return [];
  const set = new Set();
  for (const site of sites) {
    const n = normalizeSite(site);
    if (n) set.add(n);
  }
  return [...set];
}

function normalizeSite(raw) {
  if (!raw || typeof raw !== "string") return "";
  let value = raw.trim().toLowerCase();
  if (!value) return "";
  if (!value.includes("://")) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (!parsed.hostname) return "";
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return raw.trim().toLowerCase().replace(/^www\./, "").split("/")[0];
  }
}

function parseHostname(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.hostname.toLowerCase();
  } catch { return ""; }
}

function highlightMatch(value, query) {
  const lowerValue = value.toLowerCase();
  const lowerQuery = (query || "").toLowerCase();
  const index = lowerValue.indexOf(lowerQuery);
  if (!lowerQuery || index < 0) return escapeHtml(value);
  return escapeHtml(value.slice(0, index)) +
    `<strong>${escapeHtml(value.slice(index, index + lowerQuery.length))}</strong>` +
    escapeHtml(value.slice(index + lowerQuery.length));
}

function formatDuration(ms) {
  const minutesTotal = Math.floor(ms / 60000);
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return hours <= 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function runtimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) { resolve(null); return; }
      resolve(response);
    });
  });
}

function tabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
      resolve(response);
    });
  });
}

function queryTabs(queryInfo) {
  return new Promise((resolve) => chrome.tabs.query(queryInfo, resolve));
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}
