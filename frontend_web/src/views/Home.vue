<template>
    <div>
        <!-- Hero Section -->
        <section
            class="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20"
        >
            <div class="container mx-auto px-4 text-center">
                <h1 class="text-5xl font-bold mb-6 text-white">
                    Bem-vindo à Bisca Platform
                </h1>
                <p class="text-xl mb-8 text-white/90">
                    A melhor experiência de jogo de cartas Bisca online
                </p>
                <div class="flex items-center justify-center gap-4">
                    <router-link
                        v-if="!authStore.isAuthenticated"
                        to="/register"
                        class="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Começar Agora
                    </router-link>
                    <router-link
                        v-else
                        to="/play"
                        class="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Jogar Agora
                    </router-link>
                    <router-link
                        to="/spectator"
                        class="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Ver Jogos
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12 text-contrast">
                Funcionalidades
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div
                    class="p-6 card hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2 text-contrast">
                        Single-player vs Bot
                    </h3>
                    <p class="text-contrast-muted">
                        Jogue contra IA avançada e aprimore suas habilidades
                    </p>
                </div>

                <div
                    class="p-6 card hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2 text-contrast">
                        Multiplayer Online
                    </h3>
                    <p class="text-contrast-muted">
                        Desafie jogadores de todo o mundo em tempo real
                    </p>
                </div>

                <div
                    class="p-6 card hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2 text-contrast">
                        Classificações
                    </h3>
                    <p class="text-contrast-muted">
                        Compita pelos primeiros lugares da tabela global
                    </p>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="bg-contrast-secondary py-16">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-3xl font-bold mb-4 text-contrast">
                    Pronto para começar?
                </h2>
                <p class="text-contrast-muted mb-8">
                    Junte-se a milhares de jogadores e comece a jogar hoje!
                </p>
                <router-link
                    v-if="!authStore.isAuthenticated"
                    to="/register"
                    class="btn-primary px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    Criar Conta Grátis
                </router-link>
            </div>
        </section>
    </div>
</template>

<script setup>
import { useAuthStore } from "../stores/mocks/auth";

const authStore = useAuthStore();
</script>
