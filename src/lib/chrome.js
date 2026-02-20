/**
 * Thin wrappers around Chrome extension APIs to make them promise-based.
 * Nothing else should call chrome.* directly except background.js.
 */

export function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

export function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

export function sendToRuntime(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

export function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response);
    });
  });
}

export function queryTabs(queryInfo) {
  return new Promise((resolve) => chrome.tabs.query(queryInfo, resolve));
}
