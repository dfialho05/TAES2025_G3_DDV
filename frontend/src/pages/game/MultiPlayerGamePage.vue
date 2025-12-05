<script setup>
import { onMounted, onUnmounted, ref } from 'vue'; // <--- ADICIONEI 'ref' AQUI
import { useBiscaStore } from '@/stores/biscaStore';
import { storeToRefs } from 'pinia';
import Card from '@/components/game/Card.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const store = useBiscaStore();
const {
  playerHand, botCardCount, trunfo, tableCards,
  score, logs, currentTurn, isGameOver, isConnected, cardsLeft,
} = storeToRefs(store);

// Controla se estamos no Menu ou no Jogo
const gameStarted = ref(false);

// Função central para iniciar o jogo (chamada pelo URL ou pelos botões)
const chooseGameMode = (type) => {
  store.startGame(type);
  gameStarted.value = true; // Esconde menu, mostra mesa
};

onMounted(() => {
  store.connect();

  // Se viemos da Home Page com ?mode=9, iniciamos logo
  if (route.query.mode) {
    const modeFromUrl = parseInt(route.query.mode);
    chooseGameMode(modeFromUrl);
  }
});

onUnmounted(() => {
  store.disconnect();
});

</script>

<template>

</template>
