<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Modo Espectador</h1>

        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6"
        >
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold">
                        Replay: BiscaMaster vs CardKing
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Bisca de 9 - Multiplayer - 15 Jan 2024
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <span
                        class="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold"
                    >
                        Finalizado
                    </span>
                </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div class="text-center">
                        <p class="font-bold text-lg mb-1">BiscaMaster</p>
                        <p
                            class="text-3xl font-bold text-green-600 dark:text-green-400"
                        >
                            120
                        </p>
                    </div>

                    <div class="text-center px-6">
                        <p
                            class="text-sm text-gray-600 dark:text-gray-400 mb-1"
                        >
                            Resultado
                        </p>
                        <p class="text-xl font-bold">Vitória</p>
                    </div>

                    <div class="text-center">
                        <p class="font-bold text-lg mb-1">CardKing</p>
                        <p
                            class="text-3xl font-bold text-red-600 dark:text-red-400"
                        >
                            85
                        </p>
                    </div>
                </div>
            </div>

            <!-- Mock Replay Controls -->
            <div class="flex items-center gap-4 mb-4">
                <button
                    class="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <svg
                        class="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        />
                    </svg>
                </button>

                <div class="flex-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value="45"
                        class="w-full"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1"
                    >
                        <span>05:24</span>
                        <span>Jogada 7 de 12</span>
                        <span>12:00</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button
                        class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                        0.5x
                    </button>
                    <button
                        class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold"
                    >
                        1x
                    </button>
                    <button
                        class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                        2x
                    </button>
                </div>
            </div>

            <!-- Mock Game State -->
            <div
                class="bg-green-700 dark:bg-green-900 rounded-lg p-8 min-h-96 flex items-center justify-center"
            >
                <div class="text-white text-center">
                    <svg
                        class="w-16 h-16 mx-auto mb-4 opacity-50"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        />
                    </svg>
                    <p class="text-lg opacity-75">
                        Clique em Play para ver o replay
                    </p>
                </div>
            </div>
        </div>

        <!-- Recent Games to Watch -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
            <h2 class="text-xl font-bold mb-4">Jogos Recentes</h2>
            <div class="space-y-3">
                <div
                    v-for="i in 3"
                    :key="i"
                    class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                    <div>
                        <p class="font-semibold">AcePro vs BiscaFan</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Bisca de 9 - há {{ i * 5 }} minutos
                        </p>
                    </div>
                    <button
                        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                        Ver Replay
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
