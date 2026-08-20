(() => {
  const storedTheme = localStorage.getItem("theme");
  const isDark =
    storedTheme === "dark" ||
    (storedTheme === null &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
})();
