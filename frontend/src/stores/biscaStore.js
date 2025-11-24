import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io } from 'socket.io-client';

export const useBiscaStore = defineStore('bisca', () => {
  const socket = ref(null);
  const isConnected = ref(false);

  // Estado do Jogo (Reativo)
  const playerHand = ref([]);
  const botCardCount = ref(0);
  const trunfo = ref(null);
  const tableCards = ref([]);
  const score = ref({ user: 0, bot: 0 });
  const logs = ref("A conectar...");
  const currentTurn = ref(null);
  const isGameOver = ref(false);
  const cardsLeft = ref(0);
  const trunfoNaipe = ref(null);

  let contadorLogs = 0;
  // Ligar ao servidor
  const connect = () => {
    if (socket.value) return;

    // ATENÇÃO: Garante que o URL corresponde ao teu servidor (ex: localhost:3000)
    socket.value = io('http://localhost:3000');

    socket.value.on('connect', () => {
      isConnected.value = true;
      console.log("Conectado ao servidor!");
      startGame();
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
      logs.value = "Desconectado do servidor.";
    });

    // Receber atualizações do servidor
    socket.value.on('game_state', (data) => {
      contadorLogs++;
      // --- LOGS NA CONSOLA (DEBUG) ---
      console.group(contadorLogs, " - PACOTE RECEBIDO DO SOCKET - USER:", data.score.user, " | BOT: ", data.score.bot);
      console.log("Estado Completo:", data);
      console.log("Cartas na Mesa:", data.tableCards);
      console.groupEnd();

      // --- ATUALIZAÇÃO DO ESTADO ---
      playerHand.value = data.playerHand;
      botCardCount.value = data.botCardCount;
      trunfo.value = data.trunfo;
      tableCards.value = data.tableCards;
      score.value = data.score;
      logs.value = data.logs;
      currentTurn.value = data.turn;
      isGameOver.value = data.gameOver;
      cardsLeft.value = data.cardsLeft;
      trunfoNaipe.value = data.trunfoNaipe;
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const startGame = () => {
    if (socket.value) socket.value.emit('join_game');
  };

  const playCard = (index) => {
    if (currentTurn.value === 'user' && socket.value) {
      socket.value.emit('play_card', index);
    }
  };

  return {
    connect,
    disconnect,
    startGame,
    playCard,
    isConnected,
    playerHand,
    botCardCount,
    trunfo,
    tableCards,
    score,
    logs,
    currentTurn,
    isGameOver,
    cardsLeft,
  };
});
