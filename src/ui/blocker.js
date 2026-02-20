/**
 * Blocker tab: renders blocked-sites list and manages the autocomplete input.
 */
import { state } from "../state.js";
import { storageGet, storageSet, sendToRuntime } from "../lib/chrome.js";
import { normalizeSite, normalizeSites, escapeHtml, highlightMatch } from "../lib/format.js";
import { refreshAllData } from "../data.js";

const STATIC_SUGGESTIONS = [
  "youtube.com","facebook.com","instagram.com","x.com","twitter.com","reddit.com",
  "tiktok.com","linkedin.com","netflix.com","twitch.tv","pinterest.com","amazon.com",
  "wikipedia.org","bild.de","spiegel.de","zeit.de","welt.de","ebay.de",
  "kleinanzeigen.de","paypal.com","gmx.net","web.de","t-online.de","focus.de",
  "chip.de","tagesschau.de","whatsapp.com","discord.com","bing.com","duckduckgo.com",
  "booking.com","immobilienscout24.de","mobile.de","chefkoch.de","wetter.com",
  "9gag.com","tumblr.com","quora.com","stackoverflow.com","github.com","gitlab.com",
  "openai.com","notion.so","figma.com","asana.com","trello.com","cnn.com","bbc.com",
  "nytimes.com","medium.com","substack.com","news.ycombinator.com","producthunt.com",
  "imdb.com","spotify.com","soundcloud.com","udemy.com","coursera.org","edx.org",
  "khanacademy.org","fiverr.com","upwork.com","airbnb.com","tripadvisor.com",
  "skyscanner.com","kayak.com","canva.com","dribbble.com","behance.net","slack.com",
  "zoom.us","teams.microsoft.com","dropbox.com","drive.google.com","maps.google.com",
  "finance.yahoo.com","investing.com","tradingview.com","coinmarketcap.com",
  "binance.com","stripe.com","shopify.com","etsy.com","zalando.de","otto.de",
  "heise.de","computerbild.de","n-tv.de","kicker.de","transfermarkt.de",
  "xing.com","researchgate.net","arxiv.org","deepl.com","translate.google.com",
  "duck.ai","claude.ai",
];

let acState = { index: -1, options: [] };

// ── Render ────────────────────────────────────────────────────────────────────

export function renderBlockedSites() {
  const list = document.getElementById("blockList");
  const label = document.getElementById("blockedCountLabel");
  if (!list || !label) return;

  label.textContent = `${state.blockedSites.length} geblockt`;
  list.innerHTML = "";

  if (state.blockedSites.length === 0) {
    list.innerHTML = `<li class="item"><div class="item-main"><div class="item-sub">Noch keine blockierten Seiten.</div></div></li>`;
    return;
  }

  for (const site of state.blockedSites) {
    const isFav = state.favoriteSites.includes(site);
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="item-main"><div class="item-title">${escapeHtml(site)}</div></div>
      <div class="item-actions">
        <button class="icon-btn star ${isFav ? "active" : ""}" title="Favorit">★</button>
        <button class="icon-btn remove" title="Entfernen">✕</button>
      </div>`;
    li.querySelector(".star").addEventListener("click", () => toggleFavorite(site));
    li.querySelector(".remove").addEventListener("click", () => removeBlocked(site));
    list.appendChild(li);
  }
}

// ── Autocomplete ──────────────────────────────────────────────────────────────

export function initBlockerEvents() {
  const input = document.getElementById("siteInput");
  const addBtn = document.getElementById("addBtn");
  if (!input || !addBtn) return;

  addBtn.addEventListener("click", () => addFromInput());
  input.addEventListener("input", () => onInputChange());
  input.addEventListener("keydown", (e) => onInputKeyDown(e));
  document.addEventListener("click", (e) => closeAc(e.target));
}

function onInputChange() {
  const q = document.getElementById("siteInput").value.trim().toLowerCase();
  if (!q) { closeAc(); return; }
  acState.options = buildOptions(q).slice(0, 12);
  acState.index = -1;
  renderAc();
}

function onInputKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const sel = acState.options[acState.index];
    if (sel) document.getElementById("siteInput").value = sel.domain;
    addFromInput();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!acState.options.length) return;
    acState.index = (acState.index + 1) % acState.options.length;
    renderAc();
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!acState.options.length) return;
    acState.index = (acState.index - 1 + acState.options.length) % acState.options.length;
    renderAc();
  }
}

function buildOptions(query) {
  const map = new Map();
  const add = (domain, source, base) => {
    const n = normalizeSite(domain);
    if (!n) return;
    const text = n.toLowerCase();
    if (!text.includes(query)) return;
    let score = base + (text.startsWith(query) ? 100 : 55) + Math.max(0, 20 - Math.abs(text.length - query.length));
    const ex = map.get(n);
    if (!ex || score > ex.score) map.set(n, { domain: n, source, score });
  };
  STATIC_SUGGESTIONS.forEach((s) => add(s, "Top", 10));
  state.blockedSites.forEach((s) => add(s, "Geblockt", 40));
  state.favoriteSites.forEach((s) => add(s, "Favorit", 60));
  state.pageStatsTop.forEach((r) => add(r.hostname, "Besucht", 50));
  (state.recommendations?.items || []).forEach((r) => add(r.domain, "Empfehlung", 35));
  return [...map.values()].sort((a, b) => b.score - a.score);
}

function renderAc() {
  closeAc();
  if (!acState.options.length) return;
  const input = document.getElementById("siteInput");
  const wrap = input.parentElement;
  const box = document.createElement("div");
  box.className = "autocomplete-items";
  box.id = "siteInput-ac";
  acState.options.forEach((opt, i) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item" + (i === acState.index ? " active" : "");
    item.innerHTML = `${highlightMatch(opt.domain, input.value.trim())} <small>(${escapeHtml(opt.source)})</small>`;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      input.value = opt.domain;
      closeAc();
      addFromInput();
    });
    box.appendChild(item);
  });
  wrap.appendChild(box);
}

function closeAc(target) {
  const box = document.getElementById("siteInput-ac");
  if (!box) return;
  const input = document.getElementById("siteInput");
  if (target && (target === input || box.contains(target))) return;
  box.remove();
}

// ── Data mutations ────────────────────────────────────────────────────────────

async function addFromInput() {
  const input = document.getElementById("siteInput");
  const site = normalizeSite(input.value);
  if (!site) return;
  input.value = "";
  acState = { index: -1, options: [] };
  closeAc();
  await addBlocked(site);
}

export async function addBlocked(site) {
  const n = normalizeSite(site);
  if (!n) return;
  const { blockedSites = [] } = await storageGet(["blockedSites"]);
  const list = normalizeSites(blockedSites);
  if (!list.includes(n)) {
    list.push(n);
    await storageSet({ blockedSites: list });
  }
  await refreshAllData();
}

async function removeBlocked(site) {
  const n = normalizeSite(site);
  const { blockedSites = [] } = await storageGet(["blockedSites"]);
  await storageSet({ blockedSites: normalizeSites(blockedSites).filter((s) => s !== n) });
  await refreshAllData();
}

async function toggleFavorite(site) {
  const n = normalizeSite(site);
  const { favoriteSites = [] } = await storageGet(["favoriteSites"]);
  const list = normalizeSites(favoriteSites);
  await storageSet({
    favoriteSites: list.includes(n) ? list.filter((s) => s !== n) : [...list, n],
  });
  await refreshAllData();
}
