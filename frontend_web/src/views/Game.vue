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
                    <p class="font-bold text-gray-900">Tu vs Bot</p>
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
                        <p class="text-xs text-gray-600">Tu</p>
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
                        :src="cardsStore.getCardBackImage()"
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
                                :src="cardsStore.getCardBackImage()"
                                alt="Baralho"
                                class="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        <div
                            class="w-20 h-28 rounded-lg shadow-lg absolute top-0 left-0 transform translate-x-1 -translate-y-1"
                        >
                            <img
                                :src="cardsStore.getCardBackImage()"
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
                            <Card
                                suit="c"
                                :value="7"
                                :hidden="false"
                                :playable="false"
                                class="transform -rotate-90"
                            />
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
                            <Card
                                suit="o"
                                :value="7"
                                :hidden="false"
                                :playable="false"
                                class="w-28 h-36"
                            />
                        </div>

                        <!-- Player's played card -->
                        <div class="flex flex-col items-center gap-3">
                            <p class="text-sm text-gray-200 font-medium">Tu</p>
                            <div class="relative w-28 h-36">
                                <div
                                    v-if="!playerPlayedCard"
                                    class="w-full h-full bg-gray-200/20 border-2 border-dashed border-gray-400/50 rounded-lg flex items-center justify-center"
                                >
                                    <span class="text-gray-300 text-sm"
                                        >A tua vez</span
                                    >
                                </div>
                                <Transition name="card-play" appear>
                                    <Card
                                        v-if="playerPlayedCard"
                                        :key="`${playerPlayedCard.suit}-${playerPlayedCard.value}`"
                                        :suit="playerPlayedCard.suit"
                                        :value="playerPlayedCard.value"
                                        :hidden="false"
                                        :playable="false"
                                        class="absolute inset-0 w-full h-full"
                                    />
                                </Transition>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty space for symmetry -->
                <div class="w-20"></div>
            </div>

            <!-- Player Cards -->
            <div class="flex items-center justify-center gap-2 flex-wrap">
                <Card
                    v-for="(card, i) in playerCards"
                    :key="`player-${i}`"
                    :suit="card.suit"
                    :value="card.value"
                    :hidden="false"
                    :playable="true"
                    @click="handleCardPlayed"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import Card from "@/components/Card.vue";
import { useCardsStore } from "@/stores/cards.js";

// Stores
const cardsStore = useCardsStore();

// Game state
const deckSize = ref(22);
const playerPlayedCard = ref(null);

// Player cards
const playerCards = ref([
    { value: 1, suit: "e" }, // Ace of Spades
    { value: 13, suit: "p" }, // King of Clubs
    { value: 3, suit: "c" }, // 3 of Hearts
    { value: 2, suit: "e" }, // 2 of Spades
    { value: 11, suit: "c" }, // Jack of Hearts
    { value: 4, suit: "o" }, // 4 of Diamonds
    { value: 5, suit: "e" }, // 5 of Spades
]);

// Game functions

const handleCardPlayed = (card) => {
    // Set the played card to show in the table area
    playerPlayedCard.value = card;

    // Remove card from player's hand
    const cardIndex = playerCards.value.findIndex(
        (c) => c.suit === card.suit && c.value === card.value,
    );
    if (cardIndex !== -1) {
        playerCards.value.splice(cardIndex, 1);
    }

    // After 4 seconds, clear the played card (simulate round end)
    setTimeout(() => {
        playerPlayedCard.value = null;
    }, 4000);
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

/* Card play animation */
.card-play-enter-active {
    transition: all 0.6s ease-out;
}

.card-play-leave-active {
    transition: all 0.4s ease-in;
}

.card-play-enter-from {
    opacity: 0;
    transform: translateY(100px) scale(0.8) rotate(-10deg);
}

.card-play-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
}

.card-play-enter-to,
.card-play-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
}
</style>
