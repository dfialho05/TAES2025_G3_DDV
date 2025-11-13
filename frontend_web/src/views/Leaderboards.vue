<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Classificações</h1>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Top 3 Podium -->
            <div
                v-for="(player, index) in topThree"
                :key="player.rank"
                :class="getPodiumOrder(index)"
            >
                <div
                    :class="[
                        'leaderboard-card',
                        index === 0
                            ? 'gold lg:-mt-4'
                            : index === 1
                              ? 'silver'
                              : 'bronze',
                    ]"
                >
                    <div
                        :class="[
                            'leaderboard-position',
                            index === 0
                                ? 'gold'
                                : index === 1
                                  ? 'silver'
                                  : 'bronze',
                        ]"
                    >
                        {{ player.rank }}
                    </div>
                    <h3 class="font-bold text-lg mb-1 text-contrast">
                        {{ player.nickname }}
                    </h3>
                    <p
                        class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-3"
                    >
                        {{ player.points }}
                    </p>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p class="font-bold text-contrast">
                                {{ player.wins }}
                            </p>
                            <p class="text-xs text-contrast-muted">Vitórias</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">
                                {{ player.capotes }}
                            </p>
                            <p class="text-xs text-contrast-muted">Capotes</p>
                        </div>
                        <div>
                            <p class="font-bold text-contrast">
                                {{ player.bandeiras }}
                            </p>
                            <p class="text-xs text-contrast-muted">Bandeiras</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full Leaderboard -->
        <div class="card-light rounded-xl shadow-sm overflow-hidden">
            <div class="p-6 border-b border-contrast">
                <h2 class="text-xl font-bold text-contrast">
                    Classificação Global
                </h2>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="table-header-light">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Posição
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Jogador
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Vitórias
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Capotes
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Bandeiras
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Pontos
                            </th>
                        </tr>
                    </thead>
                    <tbody
                        class="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                        <tr
                            v-for="player in gamesStore.leaderboard"
                            :key="player.rank"
                            :class="[
                                'table-row-light',
                                {
                                    'bg-primary-50 dark:bg-primary-900/20':
                                        player.nickname ===
                                        authStore.user?.nickname,
                                },
                            ]"
                        >
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="font-bold text-lg text-contrast">{{
                                    player.rank
                                }}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-contrast">{{
                                        player.nickname
                                    }}</span>
                                    <span
                                        v-if="
                                            player.nickname ===
                                            authStore.user?.nickname
                                        "
                                        class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded"
                                    >
                                        Tu
                                    </span>
                                </div>
                            </td>
                            <td
                                class="px-6 py-4 whitespace-nowrap font-semibold text-contrast"
                            >
                                {{ player.wins }}
                            </td>
                            <td
                                class="px-6 py-4 whitespace-nowrap font-semibold text-contrast"
                            >
                                {{ player.capotes }}
                            </td>
                            <td
                                class="px-6 py-4 whitespace-nowrap font-semibold text-contrast"
                            >
                                {{ player.bandeiras }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                    class="font-bold text-primary-600 dark:text-primary-400"
                                    >{{ player.points }}</span
                                >
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- My Stats -->
        <div
            v-if="authStore.isAuthenticated"
            class="mt-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-sm p-6 text-white"
        >
            <h2 class="text-xl font-bold mb-4">Minhas Estatísticas</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p class="text-3xl font-bold">
                        {{ authStore.user.stats.wins }}
                    </p>
                    <p class="opacity-90">Vitórias</p>
                </div>
                <div>
                    <p class="text-3xl font-bold">
                        {{ authStore.user.stats.losses }}
                    </p>
                    <p class="opacity-90">Derrotas</p>
                </div>
                <div>
                    <p class="text-3xl font-bold">
                        {{ authStore.user.stats.capotes }}
                    </p>
                    <p class="opacity-90">Capotes</p>
                </div>
                <div>
                    <p class="text-3xl font-bold">
                        {{ authStore.user.stats.bandeiras }}
                    </p>
                    <p class="opacity-90">Bandeiras</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useGamesStore } from "../stores/mocks/games";
import { useAuthStore } from "../stores/mocks/auth";

const gamesStore = useGamesStore();
const authStore = useAuthStore();

const topThree = computed(() => gamesStore.leaderboard.slice(0, 3));

// Function to get the correct podium order (2nd-1st-3rd)
const getPodiumOrder = (index) => {
    if (index === 0) return "order-2"; // 1st place in the middle
    if (index === 1) return "order-1"; // 2nd place on the left
    if (index === 2) return "order-3"; // 3rd place on the right
    return "";
};
</script>
