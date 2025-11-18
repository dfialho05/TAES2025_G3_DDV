// stores/useGameStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io } from "socket.io-client";

export const useGameStore = defineStore("gameStore", () => {
  // Estado
  const socket = ref(null);
  const isConnected = ref(false);
  const statusMessage = ref("Desconectado");
  const playerName = ref("");
  const gameId = ref(null);
  const playerCards = ref([]);
  const trumpSuit = ref("");
  const currentTurn = ref(null);
  const deckCount = ref(0);
  const timeRemaining = ref(120000); // ms
  const logMessages = ref([]);
  const gameState = ref({});
  const canStart = ref(false);

  // Timer local
  let localTimerInterval = null;

  // -----------------------------------------------------------------
  // Utilitários
  // -----------------------------------------------------------------
  const log = (msg) => {
    logMessages.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const updateGameState = (state) => {
    gameState.value = state;
    trumpSuit.value = state.trump || "";
    currentTurn.value = state.currentTurn;
    deckCount.value = state.remaining || 0;

    if (state.hands && playerName.value && state.hands[playerName.value]) {
      playerCards.value = [...state.hands[playerName.value]];
    }
  };

  // -----------------------------------------------------------------
  // Inicialização do Socket
  // -----------------------------------------------------------------
  const initializeSocket = () => {
    if (socket.value) return;

    socket.value = io("http://localhost:3000", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    // Eventos do socket
    socket.value.on("connect", () => {
      isConnected.value = true;
      statusMessage.value = "Conectado";
      log("Ligação ao servidor estabelecida");
    });

    socket.value.on("disconnect", () => {
      isConnected.value = false;
      statusMessage.value = "Desconectado";
      log("Desligado do servidor");
      if (localTimerInterval) clearInterval(localTimerInterval);
    });

    socket.value.on("reconnecting", () => {
      statusMessage.value = "A reconectar...";
      log("Tentativa de reconexão...");
    });

    socket.value.on("authSuccess", (data) => {
      playerName.value = data.playerName;
      statusMessage.value = `Conectado como ${playerName.value}`;
      isConnected.value = true;
      canStart.value = true;
      log("Autenticado com sucesso");
    });

    socket.value.on("authError", (data) => {
      log(`Erro de autenticação: ${data.message}`);
      statusMessage.value = "Erro ao autenticar";
      isConnected.value = false;
      canStart.value = false;
    });

    socket.value.on("gameStarted", (data) => {
      gameId.value = data.gameId;
      updateGameState(data.state);

      const raw = data.turnTime ?? 30;
      timeRemaining.value = raw > 1000 ? raw : raw * 1000;

      if (localTimerInterval) clearInterval(localTimerInterval);
      localTimerInterval = setInterval(() => {
        if (timeRemaining.value > 0) timeRemaining.value -= 1000;
      }, 1000);

      log("JOGO INICIADO – Boa sorte!");
      statusMessage.value = "Jogo a decorrer";
    });

    socket.value.on("playerTimer", (data) => {
      if (typeof data.timeLeft === "number") {
        timeRemaining.value = data.timeLeft > 1000 ? data.timeLeft : data.timeLeft * 1000;
      }
    });

    socket.value.on("cardPlayed", (data) => {
      const who = data.player === playerName.value ? "Tu" : data.player;
      const cardFace = typeof data.card === "object" ? data.card.face : data.card;
      log(`${who} jogou → ${cardFace}`);

      if (data.player === playerName.value) {
        playerCards.value = playerCards.value.filter((c) => {
          const face = typeof c === "object" ? c.face : c;
          return face !== cardFace;
        });
      }
    });

    socket.value.on("turnChanged", (data) => {
      currentTurn.value = data.currentTurn;
      log(`Vez de: ${data.currentTurn}`);
    });

    socket.value.on("gameStateUpdate", (data) => {
      updateGameState(data.state);
    });

    socket.value.on("gameEnded", (data) => {
      log(`FIM DO JOGO! Vencedor: ${data.winner}`);
      statusMessage.value = "Jogo terminado";
      gameId.value = null;
      canStart.value = true;
      if (localTimerInterval) {
        clearInterval(localTimerInterval);
        localTimerInterval = null;
      }
    });

    socket.value.on("gameError", (data) => {
      log(`Erro: ${data.message}`);
    });
  };

  // -----------------------------------------------------------------
  // Conectar (CORRIGIDO)
  // -----------------------------------------------------------------
  const connect = () => {
    const nome = playerName.value?.trim();
    if (!nome) {
      log("Escreve um nome primeiro!");
      return;
    }

    // Inicializa e conecta
    initializeSocket();
    socket.value.connect();

    // Autentica
    socket.value.emit("auth", { playerName: nome });
    log(`A conectar como ${nome}...`);
  };

  // -----------------------------------------------------------------
  // Iniciar jogo singleplayer
  // -----------------------------------------------------------------
  const startSingleplayerGame = () => {
    if (!socket.value || !isConnected.value) {
      log("Não estás conectado ao servidor");
      return;
    }

    canStart.value = false;
    socket.value.emit("startSingleplayerGame", {
      playerName: playerName.value,
      turnTime: 30,
    });
    log("Pedido de jogo singleplayer enviado...");
  };

  // -----------------------------------------------------------------
  // Jogar carta
  // -----------------------------------------------------------------
  const playCard = (cardFace) => {
    if (!socket.value || !gameId.value) return;
    if (currentTurn.value !== playerName.value) {
      log("Não é a tua vez!");
      return;
    }

    socket.value.emit("playCard", {
      gameId: gameId.value,
      playerName: playerName.value,
      cardFace,
    });

    log(`Jogaste → ${cardFace}`);
  };

  // -----------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------
  const logContent = computed(() => logMessages.value.join("<br>"));
  const formattedTime = computed(() => {
    const segundos = Math.ceil(timeRemaining.value / 1000);
    return `${segundos}s`;
  });

  const playerScore = ref(0);
  const botScore = ref(0);
  const playerRoundCard = ref(null);
  const botRoundCard = ref(null);
  const roundWinner = ref(null);
  const statusClass = ref("disconnected");

  const gameInfoVisible = computed(() => !!gameId.value);
  const scoresVisible = computed(() => !!gameId.value);
  const roundCardsVisible = computed(() => !!playerRoundCard.value || !!botRoundCard.value);

  // Return da store
  return {
    // Estado reativo
    playerName,
    playerCards,
    trumpSuit,
    currentTurn,
    deckCount,
    playerScore,
    botScore,
    playerRoundCard,
    botRoundCard,
    roundWinner,
    statusMessage,
    statusClass,
    canStart,
    logContent,
    gameId,
    gameInfoVisible,
    scoresVisible,
    roundCardsVisible,
    formattedTime,

    // Métodos
    connect,
    startSingleplayerGame,
    playCard,
  };
});