/**
 * Shared mutable application state.
 * All modules import this singleton and mutate it in place.
 */
export const state = {
  // Current tab
  currentTab: null,
  currentHostname: "",

  // Blocker
  blockedSites: [],
  favoriteSites: [],

  // Element hider
  hiddenForCurrentHost: [],

  // Stats
  pageStatsTop: [],
  currentHostStats: null,
  trackedSiteCount: 0,
  activeSession: null,
  todayMs: 0,
  weekMs: 0,
  dailyStats: [], // [{label, totalMs, isToday}]

  // Recommendations
  recommendations: { items: [], updatedAt: 0 },

  // Tracker
  trackerStatus: { online: false },
  trackerApiBase: "http://127.0.0.1:4545",

  // Pomodoro
  pomodoro: {
    phase: "idle", // 'idle' | 'work' | 'short-break' | 'long-break'
    startedAt: 0,
    duration: 0,
    paused: false,
    pausedRemainingMs: 0,
    session: 1,
    settings: { work: 25, shortBreak: 5, longBreak: 15, longBreakAfter: 4 },
  },

  // UI settings
  uiTheme: "light",
  uiLanguage: "de",
};
