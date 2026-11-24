export const hasChromeTabsSupport =
  typeof chrome !== "undefined" && !!chrome.tabs;

export const isExtensionPopup =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("view") === "popup";

export type BrowserTab = {
  id: string;
  title: string;
  url: string;
  active?: boolean;
};

export const getCurrentWindowTabs = async (): Promise<BrowserTab[]> => {
  if (!hasChromeTabsSupport) {
    throw new Error("Chrome tabs API is unavailable in this environment.");
  }

  const tabs = await chrome.tabs.query({
    currentWindow: true,
  });

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { url: string } => Boolean(tab.url))
    .filter((tab) => tab.url !== "chrome://newtab/")
    .map((tab) => ({
      id: String(tab.id ?? `${tab.windowId}-${tab.index}-${tab.url}`),
      title: tab.title ?? tab.url ?? "Untitled tab",
      url: tab.url,
      active: Boolean(tab.active),
    }));
};

const isWebUrl = (url: string) => /^https?:\/\//i.test(url);

// Pages can't follow links to chrome:// and similar; popups must also route via tabs API.
export const needsTabsNavigation = (url: string) =>
  hasChromeTabsSupport && (isExtensionPopup || !isWebUrl(url));

export const openWithTabs = (url: string, newTab: boolean) => {
  if (!hasChromeTabsSupport) {
    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(url);
    }
    return;
  }

  if (newTab || isExtensionPopup) {
    void chrome.tabs.create({ url, active: !newTab });
  } else {
    void chrome.tabs.update({ url });
  }
};

export const openUrlsInNewTabs = (urls: string[]) => {
  const validUrls = urls.map((url) => url.trim()).filter(Boolean);
  if (!validUrls.length) {
    return;
  }

  if (hasChromeTabsSupport) {
    validUrls.forEach((url) => {
      void chrome.tabs.create({ url, active: false });
    });
    return;
  }

  validUrls.forEach((url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  });
};
