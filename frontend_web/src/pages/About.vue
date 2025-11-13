<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Header -->
    <section class="bg-gradient-to-r from-primary/5 to-secondary/5 py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-4xl font-bold mb-4">Sobre a Bisca Platform</h1>
          <p class="text-xl text-muted-foreground">
            Conheça a história e os valores por trás da melhor plataforma de Bisca online
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 class="text-3xl font-bold mb-6">A Nossa História</h2>
              <p class="text-muted-foreground mb-4">
                A Bisca Platform nasceu da paixão pelo jogo tradicional português de Bisca e da vontade
                de levar esta experiência única para o mundo digital. Desenvolvida por uma equipa de
                entusiastas de jogos de cartas, a nossa plataforma combina a tradição com a tecnologia moderna.
              </p>
              <p class="text-muted-foreground mb-4">
                Desde o seu lançamento, já conectamos milhares de jogadores de todo o mundo, proporcionando
                partidas emocionantes e mantendo viva a tradição deste jogo icónico.
              </p>
            </div>
            <div class="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
              <div class="text-4xl font-bold text-primary mb-2">2024</div>
              <div class="text-muted-foreground mb-4">Ano de Fundação</div>
              <div class="text-2xl font-bold text-primary mb-2">10.000+</div>
              <div class="text-muted-foreground">Jogadores Registados</div>
            </div>
          </div>

          <!-- Mission & Vision -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div class="card">
              <div class="card-content">
                <h3 class="text-2xl font-bold mb-4 text-primary">Nossa Missão</h3>
                <p class="text-muted-foreground">
                  Preservar e promover o jogo tradicional de Bisca através de uma plataforma digital
                  moderna, acessível e divertida, conectando jogadores de todas as idades e origens.
                </p>
              </div>
            </div>
            <div class="card">
              <div class="card-content">
                <h3 class="text-2xl font-bold mb-4 text-primary">Nossa Visão</h3>
                <p class="text-muted-foreground">
                  Ser a plataforma de referência mundial para jogos de cartas tradicionais portugueses,
                  mantendo viva a cultura lusitana no ambiente digital.
                </p>
              </div>
            </div>
          </div>

          <!-- Values -->
          <div class="mb-16">
            <h2 class="text-3xl font-bold text-center mb-12">Os Nossos Valores</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3">Qualidade</h3>
                <p class="text-muted-foreground">
                  Comprometemo-nos a oferecer a melhor experiência de jogo possível
                </p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3">Comunidade</h3>
                <p class="text-muted-foreground">
                  Valorizamos cada membro da nossa comunidade de jogadores
                </p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3">Inovação</h3>
                <p class="text-muted-foreground">
                  Utilizamos tecnologia de ponta para melhorar constantemente
                </p>
              </div>
            </div>
          </div>

          <!-- Team -->
          <div class="text-center">
            <h2 class="text-3xl font-bold mb-8">Equipa de Desenvolvimento</h2>
            <div class="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8">
              <p class="text-lg text-muted-foreground mb-4">
                Desenvolvido com ❤️ por estudantes apaixonados por jogos e tecnologia
              </p>
              <p class="text-muted-foreground">
                Projeto académico - TAES 2025 | Grupo 3
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// This component doesn't need any reactive state or methods
</script>

<style scoped>
.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}
</style>
