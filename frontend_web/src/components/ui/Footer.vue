<template>
  <footer class="bg-secondary/30 border-t mt-auto">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand Section -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              />
            </svg>
            <span class="text-xl font-bold text-primary">Bisca Platform</span>
          </div>
          <p class="text-muted-foreground text-sm max-w-md mb-4">
            A melhor plataforma de jogo de cartas Bisca online. Conectando jogadores de todo o mundo
            através da tradição portuguesa.
          </p>
          <div class="flex space-x-4">
            <!-- Social Links -->
            <a
              href="#"
              class="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="font-semibold text-foreground mb-4">Links Rápidos</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <router-link
                to="/"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                Início
              </router-link>
            </li>
            <li>
              <router-link
                to="/about"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                Sobre Nós
              </router-link>
            </li>
            <li>
              <router-link
                to="/rules"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                Regras do Jogo
              </router-link>
            </li>
            <li>
              <router-link
                to="/help"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                Ajuda
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="font-semibold text-foreground mb-4">Suporte</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Centro de Ajuda
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Contacto
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Reportar Bug
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Section -->
      <div
        class="border-t border-border/40 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center"
      >
        <div class="text-sm text-muted-foreground mb-4 md:mb-0">
          © {{ currentYear }} Bisca Platform. Todos os direitos reservados.
        </div>
        <div class="text-sm text-muted-foreground">
          Desenvolvido com ❤️ para preservar a tradição portuguesa
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Smooth transitions for all interactive elements */
a {
  @apply transition-all duration-200 ease-in-out;
}

a:hover {
  @apply transform translate-x-1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid {
    @apply gap-6;
  }
}
</style>
