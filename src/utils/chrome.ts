export const hasChromeTabsSupport =
  typeof chrome !== 'undefined' && !!chrome.tabs

export const getActiveTabInfo = async () => {
  if (!hasChromeTabsSupport) {
    throw new Error('Chrome tabs API is unavailable in this environment.')
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })

  if (!tab || !tab.url) {
    throw new Error('Unable to read the active tab.')
  }

  return {
    title: tab.title ?? tab.url,
    url: tab.url,
  }
}
