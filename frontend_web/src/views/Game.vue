<template>
    <div
        class="min-h-[calc(100vh-4rem)] bg-green-700 dark:bg-green-900 relative"
    >
        <!-- Game Header -->
        <div
            class="absolute top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 border-b border-gray-200/50 dark:border-gray-700/50"
        >
            <div class="container mx-auto flex items-center justify-between">
                <div class="text-contrast">
                    <p class="text-sm text-contrast-muted">
                        Bisca de 9 - Single Player
                    </p>
                    <p class="font-bold">Você vs Bot</p>
                </div>

                <div class="flex items-center gap-6 text-contrast">
                    <div class="text-center">
                        <p class="text-2xl font-bold">85</p>
                        <p class="text-xs text-contrast-muted">Bot</p>
                    </div>

                    <div class="px-4 py-2 bg-contrast-secondary rounded-lg">
                        <p class="text-sm text-contrast-muted">Tempo</p>
                        <p class="text-xl font-bold">08:32</p>
                    </div>

                    <div class="text-center">
                        <p class="text-2xl font-bold">120</p>
                        <p class="text-xs text-contrast-muted">Você</p>
                    </div>
                </div>

                <router-link
                    to="/play"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    Sair
                </router-link>
            </div>
        </div>

        <!-- Game Board -->
        <div
            class="container mx-auto px-4 pt-24 pb-8 h-[calc(100vh-4rem)] flex flex-col"
        >
            <!-- Opponent Area -->
            <div class="flex items-center justify-center gap-2 mb-8">
                <div
                    v-for="i in 9"
                    :key="`opp-${i}`"
                    class="w-20 h-28 bg-blue-900 rounded-lg border-2 border-blue-700 shadow-lg"
                ></div>
            </div>

            <!-- Center Area (Trump & Table) -->
            <div class="flex-1 flex items-center justify-center gap-8">
                <!-- Deck & Trump -->
                <Deck
                    :stack-size="deckSize"
                    :trump-card="trumpCard"
                    :show-trump="true"
                    :interactive="false"
                />

                <!-- Played Cards -->
                <div class="flex gap-4">
                    <div
                        class="w-24 h-32 bg-white rounded-lg border-2 border-gray-300 shadow-xl flex items-center justify-center"
                    >
                        <div class="text-center">
                            <p class="text-4xl">7</p>
                            <p class="text-3xl text-red-600">♦</p>
                        </div>
                    </div>
                    <div
                        class="w-24 h-32 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg"
                    ></div>
                </div>
            </div>

            <!-- Player Area -->
            <div class="flex items-center justify-center gap-2 mt-8">
                <Card
                    v-for="(card, i) in playerCards"
                    :key="`player-${i}`"
                    :suit="card.suit"
                    :value="card.value"
                    :playable="true"
                    @card-played="handleCardPlayed"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import Card from "../components/Card.vue";
import Deck from "../components/Deck.vue";

const deckSize = ref(22); // Cartas restantes no baralho
const trumpCard = ref({ suit: "c", value: 7 }); // 7 de Copas como trunfo

const playerCards = ref([
    { value: 1, suit: "e" }, // Ás de Espadas
    { value: 13, suit: "p" }, // Rei de Paus
    { value: 3, suit: "c" }, // 3 de Copas
    { value: 7, suit: "o" }, // 7 de Ouros
    { value: 12, suit: "e" }, // Dama de Espadas
    { value: 2, suit: "p" }, // 2 de Paus
    { value: 11, suit: "c" }, // Valete de Copas
    { value: 4, suit: "o" }, // 4 de Ouros
    { value: 5, suit: "e" }, // 5 de Espadas
]);

const handleCardPlayed = (card) => {
    console.log("Carta jogada:", card);
    // Aqui implementarias a lógica do jogo
};
</script>
