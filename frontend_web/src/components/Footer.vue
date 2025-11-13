<template>
    <footer
        class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto"
    >
        <div class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-gray-900 dark:text-white"
                    >
                        Bisca Platform
                    </h3>
                    <p class="text-gray-700 dark:text-gray-300 text-sm">
                        A melhor plataforma de jogo de cartas Bisca online.
                        Jogue contra amigos ou desafie a IA!
                    </p>
                </div>

                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-gray-900 dark:text-white"
                    >
                        Links Rápidos
                    </h3>
                    <div class="flex flex-col gap-2">
                        <router-link
                            to="/leaderboards"
                            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                        >
                            Classificações
                        </router-link>
                        <router-link
                            to="/statistics"
                            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                        >
                            Estatísticas
                        </router-link>
                        <router-link
                            to="/spectator"
                            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                        >
                            Modo Espectador
                        </router-link>
                    </div>
                </div>

                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-gray-900 dark:text-white"
                    >
                        Suporte
                    </h3>
                    <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
                        Precisa de ajuda? Contacte-nos:
                    </p>
                    <p
                        class="text-primary-600 dark:text-primary-400 text-sm font-medium"
                    >
                        suporte@biscaplatform.com
                    </p>
                </div>
            </div>

            <div
                class="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 text-center text-gray-700 dark:text-gray-300 text-sm"
            >
                © 2025 Bisca Platform. Todos os direitos reservados.
            </div>
        </div>
    </footer>
</template>
