export const hasChromeTabsSupport =
  typeof chrome !== 'undefined' && !!chrome.tabs

export type BrowserTab = {
  id: string
  title: string
  url: string
}

export const getCurrentWindowTabs = async (): Promise<BrowserTab[]> => {
  if (!hasChromeTabsSupport) {
    throw new Error('Chrome tabs API is unavailable in this environment.')
  }

  const tabs = await chrome.tabs.query({
    currentWindow: true,
  })

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { url: string } => Boolean(tab.url))
    .filter((tab) => tab.url !== 'chrome://newtab/')
    .map((tab) => ({
      id: String(tab.id ?? `${tab.windowId}-${tab.index}-${tab.url}`),
      title: tab.title ?? tab.url ?? 'Untitled tab',
      url: tab.url,
    }))
}
