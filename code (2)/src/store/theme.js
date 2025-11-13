import { defineStore } from "pinia"
import { ref } from "vue"

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(false)

  function toggleTheme() {
    isDark.value = !isDark.value
    if (isDark.value) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return {
    isDark,
    toggleTheme,
  }
})
