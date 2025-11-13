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
                            :src="cardsStore.getCardBackImage()"
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
                        <p class="text-white text-sm">22 cartas</p>

                        <!-- Trump -->
                        <div class="flex flex-col items-center gap-2">
                            <div
                                class="w-20 h-28 rounded-lg shadow-lg transform rotate-90"
                            >
                                <img
                                    :src="cardsStore.getCardImage('c', 7)"
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
                                        :src="cardsStore.getCardImage('o', 7)"
                                        alt="Carta do Bot"
                                        class="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                            </div>

                            <!-- Player's card area -->
                            <div class="flex flex-col items-center gap-2">
                                <p class="text-white text-sm">Jogador</p>
                                <div class="relative w-28 h-36">
                                    <div
                                        v-if="!playerPlayedCard"
                                        class="w-full h-full bg-white/20 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center"
                                    >
                                        <span class="text-white text-sm"
                                            >A tua vez</span
                                        >
                                    </div>
                                    <Transition name="card-play" appear>
                                        <div
                                            v-if="playerPlayedCard"
                                            :key="`${playerPlayedCard.suit}-${playerPlayedCard.value}`"
                                            class="absolute inset-0 w-full h-full rounded-lg shadow-xl"
                                        >
                                            <img
                                                :src="
                                                    cardsStore.getCardImage(
                                                        playerPlayedCard.suit,
                                                        playerPlayedCard.value,
                                                    )
                                                "
                                                :alt="`Carta jogada: ${playerPlayedCard.value} de ${getSuitName(playerPlayedCard.suit)}`"
                                                class="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                    </Transition>
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
                            :src="
                                cardsStore.getCardImage(card.suit, card.value)
                            "
                            :alt="
                                cardsStore.getCardDisplayName(
                                    card.suit,
                                    card.value,
                                )
                            "
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
import { useCardsStore } from "@/stores/cards.js";

// Stores
const cardsStore = useCardsStore();

// Player cards data
const playerCards = ref([
    { value: 1, suit: "e" }, // Ace of Spades
    { value: 13, suit: "p" }, // King of Clubs
    { value: 3, suit: "c" }, // 3 of Hearts
    { value: 2, suit: "e" }, // 2 of Spades
    { value: 12, suit: "e" }, // Queen of Spades
    { value: 4, suit: "o" }, // 4 of Diamonds
    { value: 11, suit: "c" }, // Jack of Hearts
    { value: 5, suit: "e" }, // 5 of Spades
]);

// Game state
const playerPlayedCard = ref(null);

// Game functions
const playCard = (card) => {
    // Set the played card to show in the table area
    playerPlayedCard.value = card;

    // Remove card from hand
    const index = playerCards.value.findIndex(
        (c) => c.suit === card.suit && c.value === card.value,
    );
    if (index !== -1) {
        playerCards.value.splice(index, 1);
    }

    // After 4 seconds, clear the played card (simulate round end)
    setTimeout(() => {
        playerPlayedCard.value = null;
    }, 4000);
};
</script>

<style scoped>
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
