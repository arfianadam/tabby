import { useCallback, useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | null;

const readStoredTheme = (): ThemePreference => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
};

const getSystemPrefersDark = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export function useDarkMode() {
  const [preference, setPreference] =
    useState<ThemePreference>(readStoredTheme);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark);

  const isDark = preference === null ? systemDark : preference === "dark";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", isDark ? "#101310" : "#efede5");
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setPreference((prev) => {
      const currentIsDark =
        prev === null ? getSystemPrefersDark() : prev === "dark";
      const next: "light" | "dark" = currentIsDark ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Ignore storage errors in restricted contexts.
      }
      return next;
    });
  }, []);

  return { isDark, toggleDarkMode };
}
