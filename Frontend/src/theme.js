import React, { useEffect, useState } from "react";

export const THEME_KEY = "workspace-theme";

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme = getStoredTheme()) {
  if (typeof document === "undefined") {
    return theme;
  }

  document.body.dataset.theme = theme;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
  }

  return theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return React.createElement(
    "button",
    {
      type: "button",
      className: "theme-toggle",
      "aria-label": `Switch to ${nextTheme} mode`,
      title: `Switch to ${nextTheme} mode`,
      onClick: () => setTheme(nextTheme),
    },
    React.createElement("span", { "aria-hidden": "true" }, theme === "dark" ? "☀️" : "🌙"),
    React.createElement("span", null, theme === "dark" ? "Light" : "Dark")
  );
}
