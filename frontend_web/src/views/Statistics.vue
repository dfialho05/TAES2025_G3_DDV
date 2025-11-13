<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Estatísticas da Plataforma</h1>

        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Jogadores Ativos
                    </p>
                    <svg
                        class="w-5 h-5 text-primary-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                        />
                    </svg>
                </div>
                <p class="text-3xl font-bold">1,234</p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                    +12% esta semana
                </p>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Jogos Hoje
                    </p>
                    <svg
                        class="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                    </svg>
                </div>
                <p class="text-3xl font-bold">567</p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                    +8% vs ontem
                </p>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Moedas Compradas
                    </p>
                    <svg
                        class="w-5 h-5 text-yellow-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <p class="text-3xl font-bold">8.9K</p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                    +15% esta semana
                </p>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Tempo Médio/Jogo
                    </p>
                    <svg
                        class="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <p class="text-3xl font-bold">14m</p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Consistente
                </p>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <h2 class="text-xl font-bold mb-4">
                    Jogos por Dia (Últimos 7 dias)
                </h2>
                <div class="h-64 flex items-end justify-between gap-2">
                    <div
                        v-for="(value, index) in [
                            120, 145, 132, 189, 156, 178, 201,
                        ]"
                        :key="index"
                        class="flex-1 bg-primary-500 rounded-t"
                        :style="{ height: `${(value / 201) * 100}%` }"
                    >
                        <div class="text-center text-xs text-white pt-2">
                            {{ value }}
                        </div>
                    </div>
                </div>
                <div
                    class="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400"
                >
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                </div>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
                <h2 class="text-xl font-bold mb-4">Variantes Mais Jogadas</h2>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between mb-1 text-sm">
                            <span>Bisca de 9</span>
                            <span class="font-semibold">100%</span>
                        </div>
                        <div
                            class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
                        >
                            <div
                                class="bg-primary-600 h-3 rounded-full"
                                style="width: 100%"
                            ></div>
                        </div>
                    </div>
                </div>

                <div class="mt-6">
                    <h3 class="font-semibold mb-3">Modo de Jogo</h3>
                    <div class="space-y-3">
                        <div>
                            <div class="flex justify-between mb-1 text-sm">
                                <span>Single-player</span>
                                <span class="font-semibold">58%</span>
                            </div>
                            <div
                                class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
                            >
                                <div
                                    class="bg-blue-600 h-3 rounded-full"
                                    style="width: 58%"
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between mb-1 text-sm">
                                <span>Multiplayer</span>
                                <span class="font-semibold">42%</span>
                            </div>
                            <div
                                class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
                            >
                                <div
                                    class="bg-purple-600 h-3 rounded-full"
                                    style="width: 42%"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Activity Timeline -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
            <h2 class="text-xl font-bold mb-4">
                Atividade Recente da Plataforma
            </h2>
            <div class="space-y-3 text-sm">
                <div
                    class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p>
                        <span class="font-semibold">BiscaMaster</span> venceu um
                        jogo de Bisca de 9
                    </p>
                    <span class="ml-auto text-gray-500 dark:text-gray-400"
                        >há 2 min</span
                    >
                </div>
                <div
                    class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p>
                        <span class="font-semibold">NovoJogador</span>
                        registou-se na plataforma
                    </p>
                    <span class="ml-auto text-gray-500 dark:text-gray-400"
                        >há 5 min</span
                    >
                </div>
                <div
                    class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                    <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p>
                        <span class="font-semibold">CardKing</span> comprou 100
                        moedas
                    </p>
                    <span class="ml-auto text-gray-500 dark:text-gray-400"
                        >há 8 min</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>
