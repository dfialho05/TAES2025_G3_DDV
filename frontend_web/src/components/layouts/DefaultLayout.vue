<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <Navbar />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '../ui/Navbar.vue'
import Footer from '../ui/Footer.vue'
</script>

<style scoped>
/* Layout specific styles */
</style>
