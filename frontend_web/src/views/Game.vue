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
import { ref, onMounted, onBeforeUnmount } from "vue";
import Card from "@/components/Card.vue";
import { useCardsStore } from "@/stores/cards.js";
import socketService from "@/services/socket.js";

// Stores
const cardsStore = useCardsStore();

// Game state
const deckSize = ref(22);
const playerPlayedCard = ref(null);
const gameId = ref(null);

// Player cards (initially empty; will be populated from server)
const playerCards = ref([]);

// Simple player name (in a real app get from auth/store)
const playerName = "Player1";

// Helpers
function faceToCard(face) {
    // face format is like 'c7' => suit 'c', value '7' (string). Convert to number.
    if (!face || typeof face !== "string") return null;
    const suit = face.charAt(0);
    const valueStr = face.slice(1);
    const value = parseInt(valueStr, 10);
    if (Number.isNaN(value)) return null;
    return { suit, value };
}

// Update local hand from server array of faces
function setLocalHandFromFaces(faces = []) {
    playerCards.value = faces.map((f) => {
        const c = faceToCard(f);
        return c || { suit: "c", value: 2 };
    });
}

// Play card clicked by user
const handleCardPlayed = (card) => {
    if (!gameId.value) {
        console.warn("No gameId set, cannot play card");
        return;
    }

    // Optimistic UI: show played card and remove from hand locally
    playerPlayedCard.value = card;
    const cardIndex = playerCards.value.findIndex(
        (c) => c.suit === card.suit && c.value === card.value,
    );
    if (cardIndex !== -1) {
        playerCards.value.splice(cardIndex, 1);
    }

    // Emit play to server using the face format expected by server
    const cardFace = `${card.suit}${card.value}`;
    socketService.playCard({ gameId: gameId.value, playerName, cardFace });

    // If server doesn't respond, we will refresh state on 'gameStateUpdate' or 'gameError'
    // Clear played card after a short animation/window; real clearing should follow server round end
    setTimeout(() => {
        playerPlayedCard.value = null;
    }, 4000);
};

// Lifecycle: connect and register listeners
onMounted(() => {
    // Initialize and connect socket service
    socketService.init({ playerName });

    // Listen for gameStarted -> populate state and save gameId
    socketService.on("gameStarted", (payload) => {
        if (!payload) return;
        if (payload.gameId) {
            gameId.value = payload.gameId;
            socketService.setCurrentGameId(gameId.value);
        }
        // Parse state to get player hand (server sends state.hands or state.playerCards)
        const state = payload.state || {};
        if (Array.isArray(state.playerCards)) {
            setLocalHandFromFaces(state.playerCards);
        } else if (state.hands && typeof state.hands === "object") {
            const faces = state.hands[playerName] || [];
            setLocalHandFromFaces(faces);
        } else {
            // fallback: try to read deck or other fields
            playerCards.value = [];
        }
    });

    // Listen for cardPlayed events to update UI (others' plays or server confirmations)
    socketService.on("cardPlayed", (data) => {
        if (!data) return;
        // If the card played is ours and server confirms, ensure it's removed (idempotent)
        const { player, card } = data;
        if (!card) return;
        if (player === playerName) {
            // Remove card from local hand if still present
            const parsed = faceToCard(card);
            if (parsed) {
                const idx = playerCards.value.findIndex(
                    (c) => c.suit === parsed.suit && c.value === parsed.value,
                );
                if (idx !== -1) playerCards.value.splice(idx, 1);
                // show played card (server may confirm)
                playerPlayedCard.value = parsed;
                setTimeout(() => {
                    playerPlayedCard.value = null;
                }, 4000);
            }
        } else {
            // Opponent (bot) played; you may display it on the table (not modeled here)
            // Optionally handle bot-specific event 'botCardPlayed'
        }
    });

    // When roundResult includes dealtCards, add the dealt card to player's hand
    socketService.on("roundResult", (result) => {
        if (!result) return;
        if (result.dealtCards && result.dealtCards[playerName]) {
            const face = result.dealtCards[playerName];
            const c = faceToCard(face);
            if (c) playerCards.value.push(c);
        }
        // Optionally update scores / deckSize from result.scores / result.nextTurn
        if (typeof result.scores === "object") {
            // update UI scoreboard if needed
        }
    });

    // Full state synchronization
    socketService.on("gameStateUpdate", (payload) => {
        if (!payload || !payload.state) return;
        const s = payload.state;
        if (Array.isArray(s.playerCards)) {
            setLocalHandFromFaces(s.playerCards);
        } else if (s.hands && typeof s.hands === "object") {
            const faces = s.hands[playerName] || [];
            setLocalHandFromFaces(faces);
        }
        if (s.remaining !== undefined) {
            deckSize.value = s.remaining;
        }
    });

    // Recovery: server fixed a distribution and sent full hands
    socketService.on("gameRecovered", (data) => {
        if (!data) return;
        if (data.hands && data.hands[playerName]) {
            setLocalHandFromFaces(data.hands[playerName]);
        }
    });

    // If server sends gameStateResponse (on explicit request)
    socketService.on("gameStateResponse", (resp) => {
        if (!resp || !resp.state) return;
        const s = resp.state;
        if (Array.isArray(s.playerCards)) {
            setLocalHandFromFaces(s.playerCards);
        } else if (s.hands && s.hands[playerName]) {
            setLocalHandFromFaces(s.hands[playerName]);
        }
    });

    // Start a singleplayer game automatically when component mounts
    // This will cause the server to emit 'gameStarted' which we handle above
    socketService.startSingleplayerGame(30);
});

// Cleanup listeners (lightweight)
onBeforeUnmount(() => {
    // Do not destroy the entire socket to allow other views to reuse connection;
    // simply remove the listeners we added via socketService by re-creating a fresh service or leaving them.
    // For simplicity we will not call socketService.destroy() here.
});
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
