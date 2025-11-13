<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20">
      <div class="container mx-auto px-4">
        <div class="text-center text-primary-foreground">
          <h1 class="text-5xl font-bold mb-6 animate-fade-in">
            Bem-vindo à Bisca Platform
          </h1>
          <p class="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            A melhor experiência de jogo de cartas Bisca online. Desafie amigos ou jogue contra IA!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button class="btn-white btn-lg animate-bounce-in">
              Começar a Jogar
            </button>
            <button class="btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              Ver Demo
            </button>
          </div>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div class="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Funcionalidades</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

          <!-- Feature 1 -->
          <div class="card hover:shadow-lg transition-shadow duration-300">
            <div class="card-content text-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold mb-3">Jogo contra IA</h3>
              <p class="text-muted-foreground">
                Treine suas habilidades jogando contra uma inteligência artificial avançada
              </p>
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="card hover:shadow-lg transition-shadow duration-300">
            <div class="card-content text-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold mb-3">Multiplayer Online</h3>
              <p class="text-muted-foreground">
                Desafie jogadores de todo o mundo em partidas online em tempo real
              </p>
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="card hover:shadow-lg transition-shadow duration-300">
            <div class="card-content text-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold mb-3">Classificações</h3>
              <p class="text-muted-foreground">
                Compita pelos primeiros lugares nas tabelas de classificação globais
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-20 bg-secondary/30">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div class="card bg-card/50 backdrop-blur-sm">
            <div class="card-content">
              <div class="text-3xl font-bold text-primary mb-2">1,000+</div>
              <div class="text-muted-foreground">Jogadores Ativos</div>
            </div>
          </div>
          <div class="card bg-card/50 backdrop-blur-sm">
            <div class="card-content">
              <div class="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div class="text-muted-foreground">Partidas Jogadas</div>
            </div>
          </div>
          <div class="card bg-card/50 backdrop-blur-sm">
            <div class="card-content">
              <div class="text-3xl font-bold text-primary mb-2">24/7</div>
              <div class="text-muted-foreground">Disponibilidade</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-4">Pronto para começar?</h2>
        <p class="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de jogadores e comece sua jornada na Bisca Platform hoje mesmo!
        </p>
        <button class="btn-primary btn-lg">
          Criar Conta Grátis
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  // Initialize theme on component mount
  themeStore.initTheme()
})
</script>

<style scoped>
/* Custom animations for the hero section */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-bounce-in {
  animation: bounce-in 0.8s ease-out 0.3s both;
}

/* Hover effects */
.card:hover {
  transform: translateY(-2px);
}
</style>
