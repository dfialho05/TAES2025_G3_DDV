<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="font-bold text-lg mb-4">Bisca Platform</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            A melhor plataforma de jogo de cartas Bisca online. Jogue contra amigos ou desafie a IA!
          </p>
        </div>
        
        <div>
          <h3 class="font-bold text-lg mb-4">Links Rápidos</h3>
          <div class="flex flex-col gap-2">
            <router-link to="/leaderboards" class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
              Classificações
            </router-link>
            <router-link to="/statistics" class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
              Estatísticas
            </router-link>
            <router-link to="/spectator" class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
              Modo Espectador
            </router-link>
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-lg mb-4">Suporte</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Precisa de ajuda? Contacte-nos:
          </p>
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            suporte@biscaplatform.com
          </p>
        </div>
      </div>
      
      <div class="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
        © 2025 Bisca Platform. Todos os direitos reservados.
      </div>
    </div>
  </footer>
</template>
