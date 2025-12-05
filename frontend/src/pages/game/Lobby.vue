<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Importar router
import { useBiscaStore } from '@/stores/biscaStore';
import { storeToRefs } from 'pinia';

const router = useRouter(); // Inicializar router
const store = useBiscaStore();
const { availableGames, gameID } = storeToRefs(store);

onMounted(() => {
  store.fetchGames(); // Pede a lista mal abre a página
});

// Criar Jogo (Player 1)
const create = () => {
    store.startGame(3); // Cria jogo de 3 cartas
    // O watch no gameID vai-nos levar para a mesa
};

// Entrar Jogo (Player 2)
const join = (id) => {
    store.joinGame(id);
};

// Se o gameID for preenchido (pelo create ou join), vamos para a mesa
store.$subscribe((mutation, state) => {
    if (state.gameID) {
        router.push('/games/singleplayer'); // Redireciona para a mesa de jogo
    }
});
</script>

<template>
  <div class="lobby-container">
    <h1>🎮 Lobby Multiplayer</h1>

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
  </div>
</template>

<style scoped>
.lobby-container { max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
.game-card {
    display: flex; justify-content: space-between; align-items: center;
    background: #fff; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;
}
.btn-create { background: #2e7d32; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1.2rem;}
.btn-join { background: #1976d2; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;}
</style>
