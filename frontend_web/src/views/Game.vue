<template>
    <div class="min-h-screen bg-green-700 relative">
        <!-- Game Header -->
        <div
            class="bg-white/95 backdrop-blur-sm p-4 border-b border-gray-200/50 z-10"
        >
            <div class="container mx-auto flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">
                        Bisca de 9 - Single Player
                    </p>
                    <p class="font-bold text-gray-900">Você vs Bot</p>
                </div>

                <div class="flex items-center gap-6">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-gray-900">85</p>
                        <p class="text-xs text-gray-600">Bot</p>
                    </div>

                    <div class="px-4 py-2 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-600">Tempo</p>
                        <p class="text-xl font-bold text-gray-900">08:32</p>
                    </div>

                    <div class="text-center">
                        <p class="text-2xl font-bold text-gray-900">120</p>
                        <p class="text-xs text-gray-600">Você</p>
                    </div>
                </div>

                <router-link
                    to="/"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    Sair
                </router-link>
            </div>
        </div>

        <!-- Game Board -->
        <div
            class="container mx-auto px-4 py-8 space-y-8 flex flex-col items-center"
        >
            <!-- Opponent Cards -->
            <div class="flex items-center justify-center gap-2">
                <div
                    v-for="i in 9"
                    :key="`opp-${i}`"
                    class="w-16 h-24 rounded-lg shadow-lg"
                >
                    <img
                        :src="cardBackImage"
                        alt="Carta virada"
                        class="w-full h-full object-cover rounded-lg"
                    />
                </div>
            </div>

            <!-- Center Area (Deck, Trump & Played Cards) - Centered Layout -->
            <div
                class="flex items-center justify-center gap-20 w-full max-w-6xl"
            >
                <!-- Deck & Trump -->
                <div class="flex flex-col items-center gap-4">
                    <!-- Deck Stack -->
                    <div class="relative">
                        <div class="w-20 h-28 rounded-lg shadow-lg">
                            <img
                                :src="cardBackImage"
                                alt="Baralho"
                                class="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        <div
                            class="w-20 h-28 rounded-lg shadow-lg absolute top-0 left-0 transform translate-x-1 -translate-y-1"
                        >
                            <img
                                :src="cardBackImage"
                                alt="Baralho"
                                class="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                    </div>
                    <p class="text-white text-sm font-medium">22 cartas</p>

                    <!-- Trump Card -->
                    <div class="flex flex-col items-center gap-2 mt-2">
                        <div
                            class="w-20 h-28 transform rotate-90 origin-center"
                        >
                            <div class="w-full h-full rounded-lg shadow-lg">
                                <img
                                    :src="getCardImage('c', 7)"
                                    alt="Trunfo"
                                    class="w-full h-full object-cover rounded-lg transform -rotate-90"
                                />
                            </div>
                        </div>
                        <div class="text-center mt-1">
                            <p class="text-white text-sm font-semibold">
                                Trunfo
                            </p>
                            <p
                                class="text-3xl font-bold text-red-600 drop-shadow-lg"
                            >
                                ♥
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Played Cards Area (Mesa) - Centered -->
                <div class="flex flex-col items-center gap-6">
                    <div class="text-center">
                        <p class="text-lg text-white font-semibold mb-4">
                            Mesa
                        </p>
                    </div>
                    <div class="flex gap-12">
                        <!-- Opponent's played card -->
                        <div class="flex flex-col items-center gap-3">
                            <p class="text-sm text-gray-200 font-medium">Bot</p>
                            <div class="w-28 h-36 rounded-lg shadow-xl">
                                <img
                                    :src="getCardImage('o', 7)"
                                    alt="Carta do Bot"
                                    class="w-full h-full object-cover rounded-lg"
                                />
                            </div>
                        </div>

                        <!-- Player's played card -->
                        <div class="flex flex-col items-center gap-3">
                            <p class="text-sm text-gray-200 font-medium">
                                Você
                            </p>
                            <div
                                class="w-28 h-36 bg-gray-200/20 border-2 border-dashed border-gray-400/50 rounded-lg flex items-center justify-center"
                            >
                                <span class="text-gray-300 text-sm"
                                    >Sua vez</span
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty space for symmetry -->
                <div class="w-20"></div>
            </div>

            <!-- Player Cards -->
            <div class="flex items-center justify-center gap-2 flex-wrap">
                <div
                    v-for="(card, i) in playerCards"
                    :key="`player-${i}`"
                    class="w-20 h-28 rounded-lg shadow-lg cursor-pointer hover:-translate-y-2 transition-all duration-200"
                    @click="handleCardPlayed(card)"
                >
                    <img
                        :src="getCardImage(card.suit, card.value)"
                        :alt="`${getCardDisplay(card.value)} de ${getSuitName(card.suit)}`"
                        class="w-full h-full object-cover rounded-lg"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import {
    cardImages,
    cardBackImage,
    getCardImage as getCardImageFromAssets,
} from "@/assets/cardImages.js";

// Game state
const deckSize = ref(22);

// Player cards
const playerCards = ref([
    { value: 1, suit: "e" }, // Ás de Espadas
    { value: 13, suit: "p" }, // Rei de Paus
    { value: 3, suit: "c" }, // 3 de Copas
    { value: 2, suit: "e" }, // 2 de Espadas
    { value: 11, suit: "c" }, // Valete de Copas
    { value: 4, suit: "o" }, // 4 de Ouros
    { value: 5, suit: "e" }, // 5 de Espadas
]);

// Helper functions
const getCardImage = (suit, value) => {
    return getCardImageFromAssets(suit, value) || cardBackImage;
};

const getCardDisplay = (value) => {
    if (value === 1) return "A";
    if (value === 11) return "J";
    if (value === 12) return "Q";
    if (value === 13) return "K";
    return value.toString();
};

const getSuitSymbol = (suit) => {
    const symbols = {
        c: "♥", // Copas
        e: "♠", // Espadas
        o: "♦", // Ouros
        p: "♣", // Paus
    };
    return symbols[suit] || "?";
};

const getSuitName = (suit) => {
    const names = {
        c: "Copas", // Copas
        e: "Espadas", // Espadas
        o: "Ouros", // Ouros
        p: "Paus", // Paus
    };
    return names[suit] || "Desconhecido";
};

const getSuitColor = (suit) => {
    return suit === "c" || suit === "o" ? "text-red-600" : "text-gray-800";
};

const handleCardPlayed = (card) => {
    console.log("Carta jogada:", card);

    // Remove card from player's hand
    const cardIndex = playerCards.value.findIndex(
        (c) => c.suit === card.suit && c.value === card.value,
    );
    if (cardIndex !== -1) {
        playerCards.value.splice(cardIndex, 1);
    }
};
</script>

<style scoped>
/* Custom responsive adjustments */
@media (max-width: 640px) {
    .container {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
}

@media (min-width: 1024px) {
    .w-20 {
        width: 6rem;
    }
    .h-28 {
        height: 8rem;
    }
    .w-28 {
        width: 7rem;
    }
    .h-36 {
        height: 9rem;
    }
}
</style>
