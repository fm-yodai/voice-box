import { computed, onUnmounted, ref, watchEffect } from "vue";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "meyasubako-theme";

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function loadTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function useTheme() {
  const theme = ref<Theme>(loadTheme());
  const prefersDark = ref(mediaQuery.matches);

  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (theme.value === "system") {
      return prefersDark.value ? "dark" : "light";
    }
    return theme.value;
  });

  function setTheme(t: Theme) {
    theme.value = t;
    localStorage.setItem(STORAGE_KEY, t);
  }

  function toggleTheme() {
    const next: ResolvedTheme = resolvedTheme.value === "dark" ? "light" : "dark";
    setTheme(next);
  }

  watchEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme.value);
  });

  function onMediaChange(e: MediaQueryListEvent) {
    prefersDark.value = e.matches;
  }

  mediaQuery.addEventListener("change", onMediaChange);

  onUnmounted(() => {
    mediaQuery.removeEventListener("change", onMediaChange);
  });

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
