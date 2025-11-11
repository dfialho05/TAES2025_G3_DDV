<template>
    <div class="flex flex-col items-center justify-between h-screen bg-green-800 text-white p-6">

        <!-- 🤖 Mão do Bot -->
        <div class="flex justify-center mt-6">
            <div v-for="(card, index) in botHand" :key="index" class="mx-1">
                <MemoryCard :card="{ face: '🂠', flipped: false, matched: false }" />
            </div>
        </div>

        <!-- 🃏 Mesa central -->
        <div class="flex flex-col items-center justify-center bg-green-900 p-6 rounded-2xl shadow-lg w-2/3 mt-10 mb-10">
            <h2 class="text-lg mb-4 font-semibold">Mesa de Jogo</h2>

            <div class="flex justify-center space-x-6">
                <div v-if="botPlayed"
                    class="p-4 bg-green-700 rounded-lg min-w-[120px] text-center transition-transform transform hover:scale-105">
                    {{ botPlayed }}
                </div>
                <div v-if="playerPlayed"
                    class="p-4 bg-green-700 rounded-lg min-w-[120px] text-center transition-transform transform hover:scale-105">
                    {{ playerPlayed }}
                </div>
                <div v-if="!botPlayed && !playerPlayed" class="opacity-70 italic">
                    Nenhuma carta jogada ainda
                </div>
            </div>

            <p class="mt-4 text-sm italic">Trunfo: {{ trumpSuit }}</p>
            <p class="mt-2 text-xs opacity-70">Turno atual: {{ currentTurn }}</p>
        </div>

        <!-- 👤 Mão do Jogador -->
        <div class="flex justify-center mb-6">
            <div v-for="(card, index) in playerHand" :key="index"
                class="mx-1 cursor-pointer hover:scale-110 transition-transform" @click="playCard(card)">
                <MemoryCard :card="{ face: card, flipped: true, matched: false }" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";
import MemoryCard from "./MemoryCard.vue";

// ⚡ Conexão Socket.IO — ajusta o endereço conforme o teu backend
const socket = io("http://localhost:3000", {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// 🧠 Estado Reativo
const playerHand = ref([]);
const botHand = ref([]);
const trumpSuit = ref("");
const currentTurn = ref("");
const playerPlayed = ref(null);
const botPlayed = ref(null);
const gameId = ref(null);

// 🧍 Configurações do jogador
const playerName = "Alice"; // 👈 muda para testar
const opponentName = null;  // null → joga contra o bot

// ======================
// 🔄 Ciclo de vida Vue
// ======================

onMounted(() => {
    console.log("🟢 Ligando ao servidor...");
    socket.emit("startGame", { playerName, opponentName });

    socket.on("connect", () => console.log("✅ Conectado ao servidor"));
    socket.on("disconnect", () => console.warn("⚠️ Desconectado do servidor"));

    socket.once("gameStarted", (data) => {
        console.log("🎮 Jogo iniciado:", data);
        gameId.value = data.gameId;
        updateGameState(data.state);
    });

    socket.on("updateState", (state) => {
        console.log("♻️ Estado atualizado:", state);
        updateGameState(state);
    });

    socket.on("error", (err) => console.error("❌ Erro:", err.message));
});

onBeforeUnmount(() => {
    console.log("🔌 Desligando listeners...");
    socket.removeAllListeners();
});

// ======================
// 🧠 Funções do jogo
// ======================

// Atualiza estado local a partir do estado do servidor
function updateGameState(state) {
    if (!state?.hands) {
        console.error("❌ Estado inválido:", state);
        return;
    }

    // Corrige caso o nome do jogador não coincida
    const playerKey = Object.keys(state.hands).find((k) => k === playerName);
    const botKey = Object.keys(state.hands).find((k) => k === "Bot");

    playerHand.value = state.hands[playerKey] || [];
    botHand.value = state.hands[botKey] || [];

    trumpSuit.value = state.trump || "";
    currentTurn.value = state.currentTurn || "";
}

// Envia carta jogada para o servidor
function playCard(card) {
    if (currentTurn.value !== playerName) {
        alert("⚠️ Não é a tua vez!");
        return;
    }

    const suit = card.charAt(0);
    const figure = parseInt(card.slice(1));

    socket.emit("playCard", {
        player: playerName,
        card: { suit, cardFigure: figure },
        gameId: gameId.value,
    });

    playerPlayed.value = card;
}
</script>

<style scoped>
/* 🎨 Estilo limpo e responsivo */
html,
body {
    margin: 0;
    padding: 0;
}

* {
    box-sizing: border-box;
}
</style>
