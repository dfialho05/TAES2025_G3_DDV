<script setup>
import { onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBiscaStore } from '@/stores/biscaStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const store = useBiscaStore();
// Extraímos gameID e availableGames para serem reativos aqui
const { availableGames, gameID } = storeToRefs(store);

onMounted(() => {
  console.log("📍 Lobby Montado");

  // 1. Tenta ligar os eventos
  // Se o socket estiver desligado, vamos ver o erro no log
  try {
      store.bindEvents();
      store.fetchGames();
      console.log("✅ Eventos ligados e jogos pedidos");
  } catch (e) {
      console.error("❌ Erro ao ligar eventos (Socket em falta?):", e);
  }
});

// Removemos eventos ao sair para evitar duplicados
onUnmounted(() => {
    store.unbindEvents();
});

// Criar Jogo (Player 1)
const create = () => {
    console.log("🖱️ Cliquei em Criar Jogo");

    // Verificação de segurança visual
    if (!store.socket && !store.gameID) { // Nota: store.socket pode não estar acessível diretamente dependendo do return do store, mas o startGame trata disso
         console.warn("⚠️ Socket parece estar desligado.");
    }

    store.startGame(3);
};

// Entrar Jogo (Player 2)
const join = (id) => {
    console.log("🖱️ Cliquei em Entrar no jogo", id);
    store.joinGame(id);
};

// --- CORREÇÃO IMPORTANTE: USAR WATCH ---
// O $subscribe pode ser "trickier". O watch é nativo do Vue e reage assim que a variável muda.
watch(gameID, (newID) => {
    console.log("👀 O gameID mudou para:", newID);
    if (newID) {
        console.log("🚀 Redirecionando para a mesa...");
        router.push('/games/singleplayer');
    }
});

// Função para voltar (para testares se o router está a funcionar)
const goHome = () => {
    router.push('/');
}
</script>

<template>
  <div class="lobby-container">
    <div class="header">
        <button @click="goHome" class="btn-back">⬅ Voltar</button>
        <h1>🎮 Lobby Multiplayer</h1>
    </div>

    <div class="actions">
      <button @click="create" class="btn-create">Criar Novo Jogo</button>
    </div>

    <h2>Jogos Disponíveis:</h2>

    <div v-if="availableGames.length === 0" class="empty-msg">
      Nenhum jogo criado. Sê o primeiro!
    </div>

    <div class="games-list">
      <div v-for="game in availableGames" :key="game.id" class="game-card">
        <div class="info">
            <strong>Jogo #{{ game.id }}</strong>
            <span>Criado por: {{ game.creator }}</span>
            <span class="badge">{{ game.type }}</span>
        </div>
        <button @click="join(game.id)" class="btn-join">Entrar</button>
      </div>
    </div>

    <div class="debug-box">
        GameID Atual: {{ gameID || 'Nenhum' }} <br>
        Logs: {{ store.logs }}
    </div>
  </div>
</template>

<style scoped>
.lobby-container { max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
.header { display: flex; align-items: center; gap: 20px; }
.btn-back { background: #666; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;}
.game-card {
    display: flex; justify-content: space-between; align-items: center;
    background: #fff; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;
}
.btn-create { background: #2e7d32; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1.2rem;}
.btn-join { background: #1976d2; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;}
.debug-box { margin-top: 50px; padding: 10px; background: #f0f0f0; border: 1px dashed red; color: red; font-family: monospace; }
</style>
