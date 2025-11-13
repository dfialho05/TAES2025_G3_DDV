<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-contrast">Teste de Contraste</h1>

        <!-- Theme Toggle -->
        <div class="mb-8 card card-body">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-contrast mb-2">
                        Alternar Tema
                    </h2>
                    <p class="text-contrast-muted">
                        Teste o contraste em ambos os modos
                    </p>
                </div>
                <button
                    @click="themeStore.toggleTheme()"
                    class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    {{ themeStore.isDark ? "Modo Claro" : "Modo Escuro" }}
                </button>
            </div>
        </div>

        <!-- Text Contrast Examples -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="card card-body">
                <h3 class="text-lg font-semibold mb-4 text-contrast">
                    Texto Principal
                </h3>
                <div class="space-y-3">
                    <p class="text-contrast text-lg">
                        Este é texto principal com boa legibilidade
                    </p>
                    <p class="text-contrast-secondary">
                        Este é texto secundário com contraste médio
                    </p>
                    <p class="text-contrast-muted text-sm">
                        Este é texto muted para informações auxiliares
                    </p>
                </div>
            </div>

            <div class="card card-body">
                <h3 class="text-lg font-semibold mb-4 text-contrast">
                    Links e Botões
                </h3>
                <div class="space-y-3">
                    <div>
                        <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">
                            Link primário
                        </a>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">
                            Primário
                        </button>
                        <button class="px-3 py-1 bg-contrast-secondary text-contrast rounded hover:bg-contrast-tertiary">
                            Secundário
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Leaderboard Style Test -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4 text-contrast">
                Teste Estilo Leaderboard
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Gold -->
                <div class="leaderboard-card gold">
                    <div class="leaderboard-position gold">1</div>
                    <h3 class="font-bold text-lg mb-1 text-contrast">JogadorOuro</h3>
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-3">
                        8520
                    </p>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p class="font-bold text-contrast">156</p>
                            <p class="text-xs text-contrast-muted">Vitórias</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">42</p>
                            <p class="text-xs text-contrast-muted">Capotes</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">89</p>
                            <p class="text-xs text-contrast-muted">Bandeiras</p>
                        </div>
                    </div>
                </div>

                <!-- Silver -->
                <div class="leaderboard-card silver">
                    <div class="leaderboard-position silver">2</div>
                    <h3 class="font-bold text-lg mb-1 text-contrast">JogadorPrata</h3>
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-3">
                        7890
                    </p>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p class="font-bold text-contrast">143</p>
                            <p class="text-xs text-contrast-muted">Vitórias</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">38</p>
                            <p class="text-xs text-contrast-muted">Capotes</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">76</p>
                            <p class="text-xs text-contrast-muted">Bandeiras</p>
                        </div>
                    </div>
                </div>

                <!-- Bronze -->
                <div class="leaderboard-card bronze">
                    <div class="leaderboard-position bronze">3</div>
                    <h3 class="font-bold text-lg mb-1 text-contrast">JogadorBronze</h3>
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-3">
                        7340
                    </p>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p class="font-bold text-contrast">132</p>
                            <p class="text-xs text-contrast-muted">Vitórias</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">35</p>
                            <p class="text-xs text-contrast-muted">Capotes</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">71</p>
                            <p class="text-xs text-contrast-muted">Bandeiras</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table Test -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4 text-contrast">Teste de Tabela</h2>
            <div class="card-light rounded-xl shadow-sm overflow-hidden">
                <div class="card-header">
                    <h3 class="text-lg font-semibold text-contrast">
                        Classificação de Teste
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="table-header-light">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Posição
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Jogador
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Pontos
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="player in testPlayers"
                                :key="player.rank"
                                class="table-row-light"
                            >
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="font-bold text-lg text-contrast">
                                        {{ player.rank }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="font-medium text-contrast">
                                        {{ player.name }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="font-bold text-primary-600 dark:text-primary-400">
                                        {{ player.points }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Background Variants -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4 text-contrast">
                Teste de Fundos
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-contrast p-4 rounded-lg border border-contrast">
                    <h3 class="font-semibold text-contrast mb-2">Fundo Principal</h3>
                    <p class="text-contrast-muted">bg-contrast</p>
                </div>
                <div class="bg-contrast-secondary p-4 rounded-lg">
                    <h3 class="font-semibold text-contrast mb-2">Fundo Secundário</h3>
                    <p class="text-contrast-muted">bg-contrast-secondary</p>
                </div>
                <div class="bg-contrast-tertiary p-4 rounded-lg">
                    <h3 class="font-semibold text-contrast mb-2">Fundo Terciário</h3>
                    <p class="text-contrast-muted">bg-contrast-tertiary</p>
                </div>
            </div>
        </div>

        <!-- Status Messages -->
        <div class="space-y-4">
            <h2 class="text-2xl font-bold mb-4 text-contrast">
                Estados e Mensagens
            </h2>

            <div class="toast-success">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">Sucesso</p>
                        <p class="text-sm">Operação realizada com sucesso!</p>
                    </div>
                </div>
            </div>

            <div class="toast-error">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">Erro</p>
                        <p class="text-sm">Ocorreu um erro durante a operação!</p>
                    </div>
                </div>
            </div>

            <div class="toast-warning">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">Aviso</p>
                        <p class="text-sm">Atenção a esta informação importante!</p>
                    </div>
                </div>
            </div>

            <div class="toast-info">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">Informação</p>
                        <p class="text-sm">Esta é uma mensagem informativa.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useThemeStore } from "../stores/theme";

const themeStore = useThemeStore();

const testPlayers = [
    { rank: 1, name: "TesteJogador1", points: 2890 },
    { rank: 2, name: "TesteJogador2", points: 2640 },
    { rank: 3, name: "TesteJogador3", points: 2450 },
    { rank: 4, name: "TesteJogador4", points: 2180 },
    { rank: 5, name: "TesteJogador5", points: 1950 },
];
</script>
