const hostname = window.location.hostname.toLowerCase();
const HIGHLIGHTER_ID = "focus-mode-highlighter";
const HUD_ID = "focus-mode-hud";

let hiddenEntries = [];
let styleTag = null;
let manageModeActive = false;
let selectionModeActive = false;

initialize();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) {
    return;
  }

  if (request.action === "start_selection") {
    startSelectionMode();
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "toggle_manage") {
    toggleManageMode();
    sendResponse({ ok: true, manageModeActive });
    return true;
  }

  if (request.action === "refresh_hidden_elements") {
    initialize().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (request.action === "remove_hidden_selector") {
    removeEntry(request.selector, request.id).then((result) =>
      sendResponse({ ok: result })
    );
    return true;
  }

  if (request.action === "get_hidden_elements") {
    sendResponse({ ok: true, hiddenEntries });
    return true;
  }
});

async function initialize() {
  const result = await storageGet(["hiddenElements"]);
  const allHidden = result.hiddenElements || {};
  const normalizedResult = normalizeEntriesWithMeta(allHidden[hostname] || []);
  hiddenEntries = normalizedResult.entries;

  if (normalizedResult.changed) {
    if (hiddenEntries.length === 0) {
      delete allHidden[hostname];
    } else {
      allHidden[hostname] = hiddenEntries;
    }
    await storageSet({ hiddenElements: allHidden });
  }

  updatePageStyles();
}

function updatePageStyles() {
  if (styleTag) {
    styleTag.remove();
  }

  styleTag = document.createElement("style");
  styleTag.id = "focus-mode-style";
  document.head.appendChild(styleTag);

  const selectors = hiddenEntries
    .map((entry) => entry.selector)
    .filter((selector) => isValidSelector(selector));

  if (selectors.length === 0) {
    styleTag.textContent = "";
    return;
  }

  if (manageModeActive) {
    styleTag.textContent = selectors
      .map(
        (selector) => `
${selector} {
  display: block !important;
  opacity: 0.4 !important;
  outline: 2px dashed #ef4444 !important;
  cursor: pointer !important;
  background: rgba(239, 68, 68, 0.14) !important;
  pointer-events: auto !important;
}
${selector}:hover {
  opacity: 1 !important;
  background: rgba(239, 68, 68, 0.24) !important;
}
`
      )
      .join("\n");
    return;
  }

  styleTag.textContent = selectors
    .map((selector) => `${selector} { display: none !important; }`)
    .join("\n");
}

function globalEscHandler(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (selectionModeActive) {
    cleanupSelectionMode();
  }
  if (manageModeActive) {
    toggleManageMode();
  }
}

function toggleManageMode() {
  if (selectionModeActive) {
    cleanupSelectionMode();
  }

  manageModeActive = !manageModeActive;
  if (manageModeActive) {
    mountHud(
      "Bearbeiten aktiv",
      "Klicke auf markierte Bereiche, um sie wieder sichtbar zu machen. ESC beendet."
    );
    document.addEventListener("click", manageClickHandler, true);
    document.addEventListener("keydown", globalEscHandler);
  } else {
    unmountHud();
    document.removeEventListener("click", manageClickHandler, true);
    document.removeEventListener("keydown", globalEscHandler);
  }

  updatePageStyles();
}

function manageClickHandler(event) {
  if (!manageModeActive) {
    return;
  }
  if (isFocusModeUi(event.target)) {
    return;
  }

  const clickedElement = event.target;
  const matchedEntry = hiddenEntries.find((entry) => {
    try {
      return (
        clickedElement.matches(entry.selector) ||
        clickedElement.closest(entry.selector)
      );
    } catch (error) {
      return false;
    }
  });

  if (!matchedEntry) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  removeEntry(matchedEntry.selector, matchedEntry.id).then((ok) => {
    if (ok) {
      mountHud("Element wieder sichtbar", matchedEntry.label || matchedEntry.selector);
      chrome.runtime.sendMessage({
        action: "record_manual_unhide",
        hostname,
        selector: matchedEntry.selector,
      });

      if (hiddenEntries.length === 0) {
        toggleManageMode();
      }
    }
  });
}

function startSelectionMode() {
  if (manageModeActive) {
    toggleManageMode();
  }
  if (selectionModeActive) {
    cleanupSelectionMode();
  }

  selectionModeActive = true;
  document.body.style.cursor = "crosshair";
  document.addEventListener("keydown", globalEscHandler);

  const highlighter = document.createElement("div");
  highlighter.id = HIGHLIGHTER_ID;
  document.body.appendChild(highlighter);

  mountHud(
    "Auswahl aktiv",
    "Klicke Elemente zum Verstecken. Mehrfachauswahl ist aktiv. ESC beendet."
  );

  window.focusModeMoveHandler = (event) => {
    if (isFocusModeUi(event.target)) {
      return;
    }
    const rect = event.target.getBoundingClientRect();
    Object.assign(highlighter.style, {
      display: "block",
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  };

  window.focusModeClickHandler = (event) => {
    if (isFocusModeUi(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const selector = buildSelector(target);
    if (!selector || !isValidSelector(selector)) {
      mountHud("Konnte Element nicht speichern", "Bitte ein anderes Element wählen.");
      return;
    }

    const label = buildLabel(target);
    addEntry(selector, label).then((added) => {
      if (added) {
        mountHud("Element versteckt", label);
      } else {
        mountHud("Schon ausgeblendet", label);
      }
    });
  };

  document.addEventListener("mousemove", window.focusModeMoveHandler, true);
  document.addEventListener("click", window.focusModeClickHandler, true);
}

function cleanupSelectionMode() {
  selectionModeActive = false;
  document.body.style.cursor = "default";

  document.getElementById(HIGHLIGHTER_ID)?.remove();
  unmountHud();

  document.removeEventListener("keydown", globalEscHandler);

  if (window.focusModeMoveHandler) {
    document.removeEventListener("mousemove", window.focusModeMoveHandler, true);
    window.focusModeMoveHandler = null;
  }

  if (window.focusModeClickHandler) {
    document.removeEventListener("click", window.focusModeClickHandler, true);
    window.focusModeClickHandler = null;
  }
}

async function addEntry(selector, label) {
  const result = await storageGet(["hiddenElements"]);
  const allHidden = result.hiddenElements || {};
  const currentEntries = normalizeEntries(allHidden[hostname] || []);

  const alreadyExists = currentEntries.some((entry) => entry.selector === selector);
  if (alreadyExists) {
    hiddenEntries = currentEntries;
    updatePageStyles();
    return false;
  }

  currentEntries.push({
    id: `fm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    selector,
    label: label || selector,
    createdAt: Date.now(),
  });

  allHidden[hostname] = currentEntries;
  await storageSet({ hiddenElements: allHidden });
  hiddenEntries = currentEntries;
  updatePageStyles();
  return true;
}

async function removeEntry(selector, id) {
  const result = await storageGet(["hiddenElements"]);
  const allHidden = result.hiddenElements || {};
  const currentEntries = normalizeEntries(allHidden[hostname] || []);

  const filtered = currentEntries.filter((entry) => {
    if (id) {
      return entry.id !== id;
    }
    return entry.selector !== selector;
  });

  if (filtered.length === currentEntries.length) {
    return false;
  }

  if (filtered.length === 0) {
    delete allHidden[hostname];
  } else {
    allHidden[hostname] = filtered;
  }

  await storageSet({ hiddenElements: allHidden });
  hiddenEntries = filtered;
  updatePageStyles();
  return true;
}

function normalizeEntries(entries) {
  return normalizeEntriesWithMeta(entries).entries;
}

function normalizeEntriesWithMeta(entries) {
  if (!Array.isArray(entries)) {
    return { entries: [], changed: entries !== undefined };
  }

  let changed = false;
  const normalized = entries
    .map((entry) => {
      if (typeof entry === "string") {
        changed = true;
        return {
          id: `legacy_${hashSelector(entry)}`,
          selector: entry,
          label: entry,
          createdAt: 0,
        };
      }

      if (!entry || typeof entry.selector !== "string") {
        changed = true;
        return null;
      }

      const normalizedEntry = {
        id: entry.id || `fm_${hashSelector(entry.selector)}`,
        selector: entry.selector,
        label: entry.label || entry.selector,
        createdAt: Number(entry.createdAt || 0),
      };
      if (
        normalizedEntry.id !== entry.id ||
        normalizedEntry.label !== entry.label ||
        normalizedEntry.createdAt !== Number(entry.createdAt || 0)
      ) {
        changed = true;
      }
      return normalizedEntry;
    })
    .filter((entry) => {
      if (!entry) {
        return false;
      }
      const valid = isValidSelector(entry.selector);
      if (!valid) {
        changed = true;
      }
      return valid;
    });

  if (normalized.length !== entries.length) {
    changed = true;
  }

  return { entries: normalized, changed };
}

function hashSelector(selector) {
  let hash = 0;
  for (let index = 0; index < selector.length; index += 1) {
    hash = (hash << 5) - hash + selector.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildSelector(element) {
  if (!(element instanceof Element)) {
    return "";
  }

  if (element.id) {
    return `${element.tagName.toLowerCase()}#${escapeCss(element.id)}`;
  }

  const parts = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${escapeCss(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const classList = [...current.classList]
      .filter((className) => className && !className.startsWith("focus-mode"))
      .slice(0, 2);
    if (classList.length > 0) {
      selector += `.${classList.map(escapeCss).join(".")}`;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter(
        (child) => child.tagName === current.tagName
      );
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

function buildLabel(element) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const cls =
    element.classList && element.classList.length > 0
      ? `.${element.classList[0]}`
      : "";
  const text = (element.textContent || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 48);

  if (text) {
    return `${tag}${id}${cls} - "${text}"`;
  }

  return `${tag}${id}${cls}`;
}

function mountHud(title, text) {
  const existing = document.getElementById(HUD_ID);
  if (existing) {
    existing.querySelector(".focus-mode-title").textContent = title;
    existing.querySelector(".focus-mode-text").textContent = text;
    return;
  }

  const hud = document.createElement("div");
  hud.id = HUD_ID;
  hud.className = "focus-mode-ui";
  hud.innerHTML = `
    <div class="focus-mode-title"></div>
    <div class="focus-mode-text"></div>
  `;
  hud.querySelector(".focus-mode-title").textContent = title;
  hud.querySelector(".focus-mode-text").textContent = text;

  document.body.appendChild(hud);
}

function unmountHud() {
  document.getElementById(HUD_ID)?.remove();
}

function isFocusModeUi(element) {
  if (!(element instanceof Element)) {
    return false;
  }
  return Boolean(element.closest(".focus-mode-ui"));
}

function escapeCss(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function isValidSelector(selector) {
  if (!selector || typeof selector !== "string") {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch (error) {
    return false;
  }
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}
