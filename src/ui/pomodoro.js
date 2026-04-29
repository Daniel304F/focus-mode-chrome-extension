/**
 * Pomodoro tab: countdown display, phase buttons, start/pause/stop controls,
 * configurable durations. Timer persistence is handled by background.js alarms.
 */
import { state } from "../state.js";
import { sendToRuntime, storageGet, storageSet } from "../lib/chrome.js";
import { formatCountdown } from "../lib/format.js";
import { t } from "../lib/i18n.js";
import { loadPomodoroState } from "../data.js";

let countdownTimer = null;

// ── Public API ────────────────────────────────────────────────────────────────

export function initPomodoroEvents() {
  document.getElementById("pomo-start")?.addEventListener("click", onStart);
  document.getElementById("pomo-pause")?.addEventListener("click", onPause);
  document.getElementById("pomo-stop")?.addEventListener("click", onStop);
  document.querySelectorAll(".pomo-phase-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectPhase(btn.dataset.phase));
  });
  document.getElementById("pomo-save-settings")?.addEventListener("click", saveSettings);
}

export function startCountdownTick() {
  clearInterval(countdownTimer);
  countdownTimer = setInterval(renderPomodoro, 1000);
}

export function stopCountdownTick() {
  clearInterval(countdownTimer);
  countdownTimer = null;
}

/** Full render of the Pomodoro page (called on data refresh + every second). */
export function renderPomodoro() {
  const p = state.pomodoro;
  const lang = state.uiLanguage;

  // ── Countdown ──
  const remaining = getRemainingMs(p);
  const cdEl = document.getElementById("pomo-countdown");
  if (cdEl) cdEl.textContent = formatCountdown(remaining);

  // Phase label
  const phaseLabel = document.getElementById("pomo-phase-label");
  if (phaseLabel) {
    const phaseKey = {
      work: "pomodoroPhaseWork",
      "short-break": "pomodoroPhaseShort",
      "long-break": "pomodoroPhaseLong",
      idle: "pomodoroPhaseIdle",
    }[p.phase] || "pomodoroPhaseIdle";
    phaseLabel.textContent = t(lang, phaseKey);
  }

  // Paused indicator
  const pausedEl = document.getElementById("pomo-paused-label");
  if (pausedEl) pausedEl.style.display = p.paused ? "" : "none";

  // Session counter
  const sessionEl = document.getElementById("pomo-session");
  const settings = p.settings || {};
  if (sessionEl) {
    sessionEl.textContent = `${t(lang, "pomodoroSession")} ${p.session || 1}/${settings.longBreakAfter || 4}`;
  }

  // Phase selector active state
  document.querySelectorAll(".pomo-phase-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.phase === p.phase);
  });

  // Button visibility
  const isIdle = p.phase === "idle";
  const isRunning = !isIdle && !p.paused;
  const isPaused = !isIdle && p.paused;

  _setVisible("pomo-start", isIdle || isPaused);
  _setVisible("pomo-pause", isRunning);
  _setVisible("pomo-stop", !isIdle);

  document.getElementById("pomo-start").textContent = isPaused
    ? t(lang, "pomodoroResume")
    : t(lang, "pomodoroStart");

  // Progress ring
  _updateRing(p, remaining);

  // Settings fields
  document.getElementById("pomo-work-min").value = settings.work ?? 25;
  document.getElementById("pomo-short-min").value = settings.shortBreak ?? 5;
  document.getElementById("pomo-long-min").value = settings.longBreak ?? 15;
  document.getElementById("pomo-after-n").value = settings.longBreakAfter ?? 4;

  // Stop tick when idle or timer reaches zero
  if (isIdle || remaining <= 0) {
    if (!isIdle) {
      // Countdown hit zero — reload state from storage in case BG already updated it
      loadPomodoroState().then(() => renderPomodoro());
    }
    stopCountdownTick();
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function onStart() {
  const p = state.pomodoro;
  const isPaused = !p.paused === false && p.phase !== "idle";

  let res;
  if (p.paused) {
    res = await sendToRuntime({ action: "pomodoro_resume" });
  } else {
    const phase = _selectedPhase();
    res = await sendToRuntime({
      action: "pomodoro_start",
      phase,
      settings: p.settings,
    });
  }

  if (res?.ok && res.state) {
    Object.assign(state.pomodoro, res.state);
    startCountdownTick();
    renderPomodoro();
  }
}

async function onPause() {
  const res = await sendToRuntime({ action: "pomodoro_pause" });
  if (res?.ok && res.state) {
    Object.assign(state.pomodoro, res.state);
    stopCountdownTick();
    renderPomodoro();
  }
}

async function onStop() {
  await sendToRuntime({ action: "pomodoro_stop" });
  await loadPomodoroState();
  stopCountdownTick();
  renderPomodoro();
}

function selectPhase(phase) {
  if (state.pomodoro.phase !== "idle") return; // can't switch while running
  document.querySelectorAll(".pomo-phase-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.phase === phase);
  });
}

async function saveSettings() {
  const work = clampInt(document.getElementById("pomo-work-min")?.value, 1, 120, 25);
  const shortBreak = clampInt(document.getElementById("pomo-short-min")?.value, 1, 60, 5);
  const longBreak = clampInt(document.getElementById("pomo-long-min")?.value, 1, 120, 15);
  const longBreakAfter = clampInt(document.getElementById("pomo-after-n")?.value, 1, 10, 4);

  const settings = { work, shortBreak, longBreak, longBreakAfter };
  state.pomodoro.settings = settings;

  // Persist settings within pomodoroState
  const stored = (await storageGet(["pomodoroState"])).pomodoroState || {};
  await storageSet({ pomodoroState: { ...stored, settings } });

  // Visual feedback
  const btn = document.getElementById("pomo-save-settings");
  if (btn) { btn.textContent = "Gespeichert"; setTimeout(() => { btn.textContent = "Speichern"; }, 1500); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRemainingMs(p) {
  if (!p || p.phase === "idle") {
    const s = p?.settings || {};
    return (s.work ?? 25) * 60 * 1000;
  }
  if (p.paused) return p.pausedRemainingMs || 0;
  return Math.max(0, p.duration - (Date.now() - p.startedAt));
}

function _selectedPhase() {
  const active = document.querySelector(".pomo-phase-btn.active");
  return active?.dataset.phase || "work";
}

function _setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? "" : "none";
}

function _updateRing(p, remainingMs) {
  const circle = document.getElementById("pomo-ring-progress");
  if (!circle) return;
  const total = p.phase === "idle" ? (p.settings?.work ?? 25) * 60 * 1000 : (p.duration || 1);
  const frac = Math.max(0, Math.min(1, remainingMs / total));
  const r = 54;
  const circumference = 2 * Math.PI * r;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference * (1 - frac)}`;
}

function clampInt(raw, min, max, fallback) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
