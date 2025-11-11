export const hasWindow = () => typeof window !== "undefined";

export const hasCryptoSupport = () =>
  hasWindow() &&
  typeof window.crypto !== "undefined" &&
  typeof window.crypto.subtle !== "undefined" &&
  typeof window.crypto.getRandomValues === "function" &&
  typeof TextEncoder !== "undefined" &&
  typeof TextDecoder !== "undefined" &&
  typeof window.btoa === "function" &&
  typeof window.atob === "function";

export const hasIndexedDbSupport = () =>
  hasWindow() && typeof window.indexedDB !== "undefined";
