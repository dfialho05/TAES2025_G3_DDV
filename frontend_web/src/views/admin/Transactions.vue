<template>
    <div>
        <div class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold">Transações Globais</h1>
            <div class="flex items-center gap-3">
                <select
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                    <option value="">Todos os tipos</option>
                    <option value="purchase">Compras</option>
                    <option value="game">Jogos</option>
                    <option value="win">Vitórias</option>
                </select>
            </div>
        </div>

        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                ID
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Data
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Utilizador
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Tipo
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Valor
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                Descrição
                            </th>
                        </tr>
                    </thead>
                    <tbody
                        class="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                        <tr
                            v-for="transaction in mockTransactions"
                            :key="transaction.id"
                        >
                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm font-mono"
                            >
                                {{ transaction.id }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                {{ transaction.date }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="font-medium">{{
                                    transaction.user
                                }}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                    :class="[
                                        'px-2 py-1 text-xs font-semibold rounded-full',
                                        transaction.type === 'purchase'
                                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                            : transaction.type === 'win'
                                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                                    ]"
                                >
                                    {{ transaction.type }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                    :class="[
                                        'font-semibold',
                                        transaction.amount > 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400',
                                    ]"
                                >
                                    {{ transaction.amount > 0 ? "+" : ""
                                    }}{{ transaction.amount }}
                                </span>
                            </td>
                            <td
                                class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400"
                            >
                                {{ transaction.description }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

const mockTransactions = ref([
    {
        id: 1001,
        date: "2024-01-15 14:30",
        user: "BiscaMaster",
        type: "purchase",
        amount: 100,
        description: "Compra de 100 moedas",
    },
    {
        id: 1002,
        date: "2024-01-15 14:25",
        user: "CardKing",
        type: "game",
        amount: -20,
        description: "Entrada em jogo - Bisca de 9",
    },
    {
        id: 1003,
        date: "2024-01-15 14:20",
        user: "AcePro",
        type: "win",
        amount: 40,
        description: "Vitória - Bisca de 9",
    },
    {
        id: 1004,
        date: "2024-01-15 14:15",
        user: "BiscaFan",
        type: "purchase",
        amount: 50,
        description: "Compra de 50 moedas",
    },
    {
        id: 1005,
        date: "2024-01-15 14:10",
        user: "CardKing",
        type: "game",
        amount: -30,
        description: "Entrada em jogo - Bisca de 9",
    },
    {
        id: 1006,
        date: "2024-01-15 14:05",
        user: "BiscaMaster",
        type: "win",
        amount: 60,
        description: "Vitória - Bisca de 9",
    },
    {
        id: 1007,
        date: "2024-01-15 14:00",
        user: "AcePro",
        type: "purchase",
        amount: 250,
        description: "Compra de 250 moedas (+50 bónus)",
    },
]);
</script>
