/**
 * Translations and language application.
 * Supports DE (default) and EN.
 */

export const TRANSLATIONS = {
  de: {
    // Nav
    navBlocker: "Blocker",
    navElemente: "Elemente",
    navStatistik: "Statistik",
    navPomodoro: "Timer",
    navEmpfehlungen: "Tipps",
    navEinstellungen: "Setup",
    // Blocker
    blockerTitle: "Seiten blockieren",
    blockerPlaceholder: "Domain, z. B. reddit.com",
    blockerAddBtn: "Blockieren",
    // Elemente
    elementeTitle: "Elemente verstecken",
    elementePickerBtn: "Auswahl starten",
    elementeManageBtn: "Verwalten",
    elementeResetBtn: "Zurücksetzen",
    // Stats
    statsTitle: "Übersicht",
    statsTrackedSites: "Getrackte Seiten",
    statsToday: "Heute gesamt",
    statsWeek: "Diese Woche",
    statsTopSites: "Top-Seiten",
    statsLast7Days: "Letzte 7 Tage",
    // Pomodoro
    pomodoroTitle: "Pomodoro-Timer",
    pomodoroPhaseWork: "Fokus",
    pomodoroPhaseShort: "Kurze Pause",
    pomodoroPhaseLong: "Lange Pause",
    pomodoroPhaseIdle: "Bereit",
    pomodoroStart: "Starten",
    pomodoroPause: "Pausieren",
    pomodoroResume: "Fortsetzen",
    pomodoroStop: "Beenden",
    pomodoroSession: "Einheit",
    pomodoroSettingsTitle: "Einstellungen",
    pomodoroWorkMin: "Fokuszeit (min)",
    pomodoroShortMin: "Kurze Pause (min)",
    pomodoroLongMin: "Lange Pause (min)",
    pomodoroAfter: "Lange Pause nach",
    pomodoroSessions: "Einheiten",
    // Empfehlungen
    recsTitle: "Empfehlungen",
    recsReloadBtn: "Neu laden",
    // Setup
    setupSqliteTitle: "SQLite-Tracker",
    setupSqliteInfo: "Browsing-Daten werden standardmäßig lokal in Chrome gespeichert. Der optionale SQLite-Tracker sichert sie dauerhaft in einer lokalen Datenbankdatei auf deinem Rechner – ideal für Langzeit-Auswertungen.",
    setupSqliteEnable: "SQLite aktivieren",
    setupSqliteHowTo: "Server starten: cd tracker-server && node server.js",
    setupSaveBtn: "Speichern",
    setupReconnectBtn: "Verbinden",
    setupAppearanceTitle: "Darstellung",
    setupDarkMode: "Dunkelmodus",
    setupLanguage: "Sprache",
    setupLlmTitle: "KI-Zusammenfassung",
    setupLlmProvider: "Anbieter",
    setupLlmProviderAnthropic: "Anthropic (Standard)",
    setupLlmProviderCustom: "Benutzerdefinierter Endpunkt",
    setupLlmEndpointLabel: "Endpunkt-URL",
    setupLlmEndpointPlaceholder: "https://litellm.example.com/v1/chat/completions",
    setupLlmModelLabel: "Modell",
    setupLlmModelPlaceholder: "gpt-4o-mini",
    setupLlmKeyLabel: "API-Key (optional bei eigenem Endpunkt)",
    setupLlmKeyPlaceholder: "sk-ant-... oder Bearer-Token",
    setupLlmBtn: "Zusammenfassen",
    setupLlmLoading: "Analysiere Daten…",
    setupShortcutInfo: "Tastenkürzel: Strg+Umschalt+F · Anpassen unter chrome://extensions/shortcuts",
    // Status
    reconnectOk: "Verbunden",
    reconnectErr: "Offline",
    reconnectTrying: "Verbinde…",
    llmErrNoKey: "Bitte zuerst einen API-Key eingeben.",
    llmErrNoEndpoint: "Bitte eine Endpunkt-URL eingeben.",
    llmErrNoModel: "Bitte einen Modellnamen eingeben.",
    llmErrNoData: "Noch keine Browsing-Daten vorhanden.",
    llmErrNetwork: "Netzwerkfehler beim Aufruf der API.",
    llmPromptIntro:
      "Analysiere diese Browser-Statistiken kurz und gib 2–3 konkrete Produktivitäts-Tipps (max. 150 Wörter, auf Deutsch):",
  },
  en: {
    navBlocker: "Blocker",
    navElemente: "Elements",
    navStatistik: "Stats",
    navPomodoro: "Timer",
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
    pomodoroTitle: "Pomodoro Timer",
    pomodoroPhaseWork: "Focus",
    pomodoroPhaseShort: "Short Break",
    pomodoroPhaseLong: "Long Break",
    pomodoroPhaseIdle: "Ready",
    pomodoroStart: "Start",
    pomodoroPause: "Pause",
    pomodoroResume: "Resume",
    pomodoroStop: "Stop",
    pomodoroSession: "Session",
    pomodoroSettingsTitle: "Settings",
    pomodoroWorkMin: "Focus (min)",
    pomodoroShortMin: "Short break (min)",
    pomodoroLongMin: "Long break (min)",
    pomodoroAfter: "Long break after",
    pomodoroSessions: "sessions",
    recsTitle: "Recommendations",
    recsReloadBtn: "Refresh",
    setupSqliteTitle: "SQLite Tracker",
    setupSqliteInfo: "Browsing data is stored locally in Chrome by default. The optional SQLite tracker saves it permanently in a local database file on your machine – ideal for long-term statistics.",
    setupSqliteEnable: "Enable SQLite",
    setupSqliteHowTo: "Start server: cd tracker-server && node server.js",
    setupSaveBtn: "Save",
    setupReconnectBtn: "Connect",
    setupAppearanceTitle: "Appearance",
    setupDarkMode: "Dark Mode",
    setupLanguage: "Language",
    setupLlmTitle: "AI Summary",
    setupLlmProvider: "Provider",
    setupLlmProviderAnthropic: "Anthropic (Default)",
    setupLlmProviderCustom: "Custom Endpoint",
    setupLlmEndpointLabel: "Endpoint URL",
    setupLlmEndpointPlaceholder: "https://litellm.example.com/v1/chat/completions",
    setupLlmModelLabel: "Model",
    setupLlmModelPlaceholder: "gpt-4o-mini",
    setupLlmKeyLabel: "API Key (optional for custom endpoint)",
    setupLlmKeyPlaceholder: "sk-ant-... or Bearer token",
    setupLlmBtn: "Summarize",
    setupLlmLoading: "Analyzing…",
    setupShortcutInfo: "Shortcut: Ctrl+Shift+F · Customize at chrome://extensions/shortcuts",
    reconnectOk: "Connected",
    reconnectErr: "Offline",
    reconnectTrying: "Connecting…",
    llmErrNoKey: "Please enter an API key first.",
    llmErrNoEndpoint: "Please enter an endpoint URL.",
    llmErrNoModel: "Please enter a model name.",
    llmErrNoData: "No browsing data available yet.",
    llmErrNetwork: "Network error calling the API.",
    llmPromptIntro:
      "Briefly analyze these browsing statistics and give 2–3 concrete productivity tips (max. 150 words, in English):",
  },
};

/**
 * Applies translations to all [data-i18n] and [data-i18n-ph] elements,
 * and programmatically updates select options for language picker.
 */
export function applyLanguage(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.de;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.dataset.i18nPh;
    if (t[key] !== undefined) el.placeholder = t[key];
  });
}

export function t(lang, key) {
  return (TRANSLATIONS[lang] || TRANSLATIONS.de)[key] ?? key;
}
