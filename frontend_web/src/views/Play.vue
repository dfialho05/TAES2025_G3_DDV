<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <h1 class="text-3xl font-bold mb-8">Jogar</h1>

        <!-- Game Variant Selection -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6"
        >
            <h2 class="text-xl font-bold mb-4">Bisca de 9</h2>
            <div
                class="p-6 border-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left"
            >
                <h3 class="text-lg font-bold mb-2">Bisca de 9</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Jogo completo com 9 cartas por jogador
                </p>
                <div class="mt-3 flex items-center gap-2 text-sm">
                    <svg
                        class="w-4 h-4 text-primary-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="text-gray-600 dark:text-gray-400"
                        >~20 minutos</span
                    >
                </div>
            </div>
        </div>

        <!-- Game Mode Selection -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
            <h2 class="text-xl font-bold mb-4">Modo de Jogo</h2>

            <div class="space-y-4">
                <!-- Single Player -->
                <div
                    class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold mb-2">
                                Single-player vs Bot
                            </h3>
                            <p
                                class="text-sm text-gray-600 dark:text-gray-400 mb-3"
                            >
                                Joga contra a inteligência artificial. Ideal
                                para praticar!
                            </p>
                            <div class="flex items-center gap-4 text-sm">
                                <span
                                    class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded font-semibold"
                                >
                                    Custo: 20 moedas
                                </span>
                                <span class="text-gray-600 dark:text-gray-400">
                                    Prémio: 40 moedas (vitória)
                                </span>
                            </div>
                        </div>
                        <button
                            @click="startGame('bot')"
                            class="px-6 py-3 rounded-lg font-semibold transition-colors bg-primary-600 text-white hover:bg-primary-700"
                        >
                            Jogar
                        </button>
                    </div>
                </div>

                <!-- Multiplayer -->
                <div
                    class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold mb-2">
                                Multiplayer Online
                            </h3>
                            <p
                                class="text-sm text-gray-600 dark:text-gray-400 mb-3"
                            >
                                Desafia jogadores reais de todo o mundo!
                            </p>
                            <div class="flex items-center gap-4 text-sm">
                                <span
                                    class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded font-semibold"
                                >
                                    Custo: 30 moedas
                                </span>
                                <span class="text-gray-600 dark:text-gray-400">
                                    Prémio: 60 moedas (vitória)
                                </span>
                            </div>
                        </div>
                        <button
                            @click="startGame('multiplayer')"
                            class="px-6 py-3 rounded-lg font-semibold transition-colors bg-primary-600 text-white hover:bg-primary-700"
                        >
                            Procurar Jogo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const selectedVariant = ref("bisca9");

function startGame(mode) {
    // Mock - redirect to game page
    router.push(`/game/${Date.now()}`);
}
</script>
