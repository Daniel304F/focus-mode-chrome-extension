/**
 * Settings tab: server reconnect, theme toggle switch, language select,
 * API key management, and LLM summary via Anthropic API.
 */
import { state } from "../state.js";
import { storageGet, storageSet, sendToRuntime } from "../lib/chrome.js";
import { escapeHtml, formatDuration } from "../lib/format.js";
import { applyLanguage, t } from "../lib/i18n.js";
import { refreshAllData } from "../data.js";

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initSettings() {
  const stored = await storageGet(["uiTheme", "uiLanguage", "anthropicApiKey"]);
  state.uiTheme = stored.uiTheme || "light";
  state.uiLanguage = stored.uiLanguage || "de";

  applyTheme(state.uiTheme);
  applyLanguage(state.uiLanguage);

  const keyInput = document.getElementById("apiKeyInput");
  if (keyInput && stored.anthropicApiKey) keyInput.value = stored.anthropicApiKey;

  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.value = state.uiLanguage;
}

export function initSettingsEvents() {
  // Theme toggle switch
  document.getElementById("themeToggle")?.addEventListener("change", (e) => {
    toggleTheme(e.target.checked);
  });

  // Language select
  document.getElementById("langSelect")?.addEventListener("change", (e) => {
    setLanguage(e.target.value);
  });

  // Server
  document.getElementById("saveTrackerUrlBtn")?.addEventListener("click", saveTrackerUrl);
  document.getElementById("reconnectBtn")?.addEventListener("click", reconnectTracker);

  // API key
  const keyInput = document.getElementById("apiKeyInput");
  keyInput?.addEventListener("blur", () => {
    storageSet({ anthropicApiKey: keyInput.value.trim() });
  });
  document.getElementById("toggleApiKeyBtn")?.addEventListener("click", () => {
    const isPassword = keyInput.type === "password";
    keyInput.type = isPassword ? "text" : "password";
    document.getElementById("toggleApiKeyBtn").textContent = isPassword ? "🙈" : "👁";
  });

  // LLM summary
  document.getElementById("summarizeBtn")?.addEventListener("click", summarizeData);
}

export function renderSettings() {
  const urlInput = document.getElementById("trackerUrlInput");
  if (urlInput) urlInput.value = state.trackerApiBase;
  renderTrackerChip();
}

export function renderTrackerChip() {
  const chip = document.getElementById("trackerStatusChip");
  if (!chip) return;
  const online = Boolean(state.trackerStatus?.online);
  chip.classList.remove("ok", "err");
  chip.classList.add(online ? "ok" : "err");
  chip.textContent = online
    ? `SQLite: online (${state.trackerStatus.totalSessions || 0})`
    : "SQLite: offline";
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function toggleTheme(isDark) {
  const theme = isDark ? "dark" : "light";
  state.uiTheme = theme;
  applyTheme(theme);
  storageSet({ uiTheme: theme });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = theme === "dark";
}

// ── Language ──────────────────────────────────────────────────────────────────

async function setLanguage(lang) {
  state.uiLanguage = lang;
  applyLanguage(lang);
  await storageSet({ uiLanguage: lang });
}

// ── Server ────────────────────────────────────────────────────────────────────

async function saveTrackerUrl() {
  const value = (document.getElementById("trackerUrlInput")?.value || "").trim();
  if (!value) return;
  await storageSet({ trackerApiBase: value.replace(/\/$/, "") });
  state.trackerApiBase = value.replace(/\/$/, "");
  const ping = await sendToRuntime({ action: "ping_tracker" }).catch(() => null);
  if (ping?.ok && ping.status) state.trackerStatus = ping.status;
  renderTrackerChip();
  await refreshAllData();
}

async function reconnectTracker() {
  const lang = state.uiLanguage;
  const btn = document.getElementById("reconnectBtn");
  const statusEl = document.getElementById("reconnectStatus");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = t(lang, "reconnectTrying");
  if (statusEl) statusEl.textContent = "";

  const ping = await sendToRuntime({ action: "ping_tracker" }).catch(() => null);
  const ok = ping?.ok && ping?.status?.online;

  if (ok) {
    state.trackerStatus = ping.status;
    if (statusEl) { statusEl.style.color = "var(--ok)"; statusEl.textContent = t(lang, "reconnectOk"); }
  } else {
    if (statusEl) { statusEl.style.color = "var(--warning)"; statusEl.textContent = t(lang, "reconnectErr"); }
  }

  renderTrackerChip();
  btn.textContent = t(lang, "setupReconnectBtn");
  btn.disabled = false;
  setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
}

// ── LLM ───────────────────────────────────────────────────────────────────────

async function summarizeData() {
  const lang = state.uiLanguage;
  const apiKey = document.getElementById("apiKeyInput")?.value.trim();
  const btn = document.getElementById("summarizeBtn");
  const resultEl = document.getElementById("summaryResult");
  if (!resultEl) return;

  if (!apiKey) return showSummary(t(lang, "llmErrNoKey"), "error");
  if (!state.pageStatsTop?.length) return showSummary(t(lang, "llmErrNoData"), "error");

  btn.disabled = true;
  showSummary(t(lang, "setupLlmLoading"), "loading");

  const prompt = buildPrompt(lang);
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
    showSummary(data?.content?.[0]?.text || "Keine Antwort erhalten.", "ok");
  } catch {
    showSummary(t(lang, "llmErrNetwork"), "error");
  } finally {
    btn.disabled = false;
  }
}

function buildPrompt(lang) {
  const top5 = (state.pageStatsTop || []).slice(0, 5)
    .map((s, i) => `  ${i + 1}. ${s.hostname} — ${formatDuration(s.totalMs || 0)} (${s.visits || 0}×)`)
    .join("\n");
  return [
    t(lang, "llmPromptIntro"),
    "",
    `Heute: ${formatDuration(state.todayMs)}`,
    `Diese Woche: ${formatDuration(state.weekMs)}`,
    `Getrackte Seiten: ${state.trackedSiteCount}`,
    `Blockierte Seiten: ${state.blockedSites.length}`,
    "Top-Seiten:",
    top5,
  ].join("\n");
}

function showSummary(text, type) {
  const el = document.getElementById("summaryResult");
  if (!el) return;
  el.style.display = "";
  el.className = `summary-box${type !== "ok" ? ` ${type}` : ""}`;
  el.textContent = text;
}
