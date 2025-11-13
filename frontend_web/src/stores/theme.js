import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(false);

  // Check for saved theme preference or default to system preference
  function initTheme() {
    const savedTheme = localStorage.getItem("bisca_theme");
    if (savedTheme) {
      isDark.value = savedTheme === "dark";
    } else {
      // Check system preference
      isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    updateDOMTheme();
  }

  function updateDOMTheme() {
    if (isDark.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem("bisca_theme", isDark.value ? "dark" : "light");
    updateDOMTheme();
  }

  function setTheme(theme) {
    isDark.value = theme === "dark";
    localStorage.setItem("bisca_theme", theme);
    updateDOMTheme();
  }

  // Watch for system theme changes
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("bisca_theme")) {
          isDark.value = e.matches;
          updateDOMTheme();
        }
      });
  }

  // Watch for theme changes and update DOM
  watch(isDark, updateDOMTheme, { immediate: true });

  // Initialize theme on store creation
  if (typeof window !== "undefined") {
    initTheme();
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    initTheme,
  };
});
