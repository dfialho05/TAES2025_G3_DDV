<template>
    <div :class="themeClass">
        <router-view />
    </div>
</template>

<script setup>
import { useThemeStore } from "./stores/theme";

const themeStore = useThemeStore();
const themeClass = themeStore.isDark ? "dark" : "light";
</script>
