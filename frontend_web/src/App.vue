<template>
  <div id="app" :class="{ dark: themeStore.isDark }">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  // Initialize theme on app startup
  themeStore.initTheme()
})
</script>

<style>
/* Global styles */
html {
  height: 100%;
  scroll-behavior: smooth;
}

body {
  height: 100%;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.7);
}

/* Focus styles for accessibility */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Animation classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Loading spinner */
.spinner {
  @apply animate-spin;
}

/* Responsive text */
@media (max-width: 640px) {
  .text-responsive-lg {
    font-size: 1.5rem;
  }

  .text-responsive-xl {
    font-size: 1.875rem;
  }

  .text-responsive-2xl {
    font-size: 2.25rem;
  }
}

@media (min-width: 641px) {
  .text-responsive-lg {
    font-size: 1.875rem;
  }

  .text-responsive-xl {
    font-size: 2.25rem;
  }

  .text-responsive-2xl {
    font-size: 3rem;
  }
}
</style>
