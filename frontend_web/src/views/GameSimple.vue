<template>
    <div class="min-h-screen bg-green-700 p-8">
        <div class="container mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-lg p-4 mb-8">
                <div class="flex items-center justify-between">
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

            <!-- Game Area -->
            <div class="space-y-8 flex flex-col items-center">
                <!-- Opponent Cards -->
                <div class="flex justify-center gap-2">
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

                <!-- Center Area -->
                <div
                    class="flex items-center justify-center gap-20 w-full max-w-6xl"
                >
                    <!-- Deck and Trump -->
                    <div class="flex flex-col items-center gap-4">
                        <!-- Deck -->
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
                        <p class="text-white text-sm">22 cartas</p>

                        <!-- Trump -->
                        <div class="flex flex-col items-center gap-2">
                            <div
                                class="w-20 h-28 rounded-lg shadow-lg transform rotate-90"
                            >
                                <img
                                    :src="getCardImage('c', 7)"
                                    alt="Trunfo"
                                    class="w-full h-full object-cover rounded-lg transform -rotate-90"
                                />
                            </div>
                            <div class="text-center">
                                <p class="text-white text-sm font-semibold">
                                    Trunfo
                                </p>
                                <p class="text-white text-2xl">♥</p>
                            </div>
                        </div>
                    </div>

                    <!-- Playing Area (Mesa) - Centered -->
                    <div class="flex flex-col items-center gap-6">
                        <h2 class="text-white text-xl font-semibold">Mesa</h2>
                        <div class="flex gap-12">
                            <!-- Bot's card -->
                            <div class="flex flex-col items-center gap-2">
                                <p class="text-white text-sm">Bot</p>
                                <div class="w-28 h-36 rounded-lg shadow-xl">
                                    <img
                                        :src="getCardImage('o', 7)"
                                        alt="Carta do Bot"
                                        class="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                            </div>

                            <!-- Player's card -->
                            <div class="flex flex-col items-center gap-2">
                                <p class="text-white text-sm">Você</p>
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
                <div class="flex justify-center gap-2 flex-wrap">
                    <div
                        v-for="(card, i) in playerCards"
                        :key="`player-${i}`"
                        class="w-20 h-28 rounded-lg shadow-lg cursor-pointer hover:-translate-y-2 transition-transform"
                        @click="playCard(card)"
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
    </div>
</template>

<script setup>
import { ref } from "vue";
import {
    cardImages,
    cardBackImage,
    getCardImage as getCardImageFromAssets,
} from "@/assets/cardImages.js";

// Player cards data
const playerCards = ref([
    { value: 1, suit: "e" }, // Ás de Espadas
    { value: 13, suit: "p" }, // Rei de Paus
    { value: 3, suit: "c" }, // 3 de Copas
    { value: 2, suit: "e" }, // 2 de Espadas
    { value: 12, suit: "e" }, // Dama de Espadas
    { value: 4, suit: "o" }, // 4 de Ouros
    { value: 11, suit: "c" }, // Valete de Copas
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

const playCard = (card) => {
    console.log("Carta jogada:", card);
    // Remove card from hand
    const index = playerCards.value.findIndex(
        (c) => c.suit === card.suit && c.value === card.value,
    );
    if (index !== -1) {
        playerCards.value.splice(index, 1);
    }
};
</script>
