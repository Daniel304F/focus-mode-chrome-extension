/** Statistics tab: overview boxes, top-sites bar chart, 7-day column chart. */
import { state } from "../state.js";
import { escapeHtml, formatDuration } from "../lib/format.js";

export function renderStats() {
  _renderOverview();
  _renderTopSites();
  _renderDailyChart();
}

export function renderLiveTimer() {
  if (!state.currentHostname) return;
  let total = Number(state.currentHostStats?.totalMs || 0);
  if (
    state.activeSession?.hostname === state.currentHostname &&
    state.activeSession.startedAt
  ) {
    total += Math.max(0, Date.now() - Number(state.activeSession.startedAt));
  }
  const el = document.getElementById("currentHostTimeValue");
  if (el) el.textContent = formatDuration(total);
}

// ── private ───────────────────────────────────────────────────────────────────

function _renderOverview() {
  const setVal = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setVal("currentHostTimeValue", formatDuration(Number(state.currentHostStats?.totalMs || 0)));
  const label = document.getElementById("currentHostTimeLabel");
  if (label) label.textContent = state.currentHostname || "Aktive Domain";
  setVal("trackedSitesValue", String(state.trackedSiteCount || 0));
  setVal("todayTimeValue", formatDuration(state.todayMs || 0));
  setVal("weekTimeValue", formatDuration(state.weekMs || 0));
}

function _renderTopSites() {
  const container = document.getElementById("topStatsList");
  const countLabel = document.getElementById("topSitesCountLabel");
  if (!container) return;

  container.innerHTML = "";
  if (!state.pageStatsTop?.length) {
    container.innerHTML = `<div class="item"><div class="item-main"><div class="item-sub">Noch keine Tracking-Daten vorhanden.</div></div></div>`;
    if (countLabel) countLabel.textContent = "";
    return;
  }

  const top = state.pageStatsTop.slice(0, 10);
  if (countLabel) countLabel.textContent = `${top.length} Seiten`;
  const maxMs = top[0]?.totalMs || 1;

  for (const entry of top) {
    const pct = Math.max(3, Math.round((entry.totalMs / maxMs) * 100));
    const div = document.createElement("div");
    div.className = "bar-item";
    div.innerHTML = `
      <div class="bar-top">
        <span class="bar-name">${escapeHtml(entry.hostname)}</span>
        <span class="bar-meta">${formatDuration(entry.totalMs || 0)} · ${entry.visits || 0}×</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
    container.appendChild(div);
  }
}

function _renderDailyChart() {
  const card = document.getElementById("dailyCard");
  const chart = document.getElementById("dailyChart");
  const weekLabel = document.getElementById("weekTotalLabel");
  if (!card || !chart) return;

  const days = state.dailyStats;
  if (!days?.length || !days.some((d) => d.totalMs > 0)) {
    card.style.display = "none";
    return;
  }

  card.style.display = "";
  const maxMs = Math.max(...days.map((d) => d.totalMs), 1);
  const weekTotal = days.reduce((s, d) => s + d.totalMs, 0);
  if (weekLabel) weekLabel.textContent = `Gesamt: ${formatDuration(weekTotal)}`;

  chart.innerHTML = "";
  for (const day of days) {
    const h = Math.max(3, Math.round((day.totalMs / maxMs) * 100));
    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-bar" style="height:${h}%" title="${formatDuration(day.totalMs)}"></div>
      <div class="day-label${day.isToday ? " today" : ""}">${escapeHtml(day.label)}</div>`;
    chart.appendChild(col);
  }
}
