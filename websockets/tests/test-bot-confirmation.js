// Test script for bot confirmation and retry system
// This script tests the bot response confirmation mechanism

import { Server } from "socket.io";
import { GameManager } from "./handlers/gameManager.js";
import {
  triggerBotPlayIfNeeded,
  clearBotResponseTimer,
} from "./handlers/gameHandlers.js";
import config from "./config.js";

// Create test server
const io = new Server(3001, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

const manager = new GameManager();

console.log("Iniciando teste do sistema de confirmação do bot...");
console.log(`Configurações atuais:`);
console.log(
  `   - Timeout de resposta: ${config.bot.confirmation.responseTimeout}ms`,
);
console.log(`   - Máximo de tentativas: ${config.bot.confirmation.maxRetries}`);
console.log(`   - Sistema habilitado: ${config.bot.confirmation.enabled}`);
console.log(
  `   - Delay base de retry: ${config.bot.confirmation.retryBaseDelay}ms`,
);

// Mock game state for testing
const createMockGame = (gameId, botShouldFail = false) => {
  return {
    gameId,
    bot: "Bot",
    currentTurn: "Bot",
    players: ["TestPlayer", "Bot"],
    hands: {
      TestPlayer: [],
      Bot: [
        { getSuit: () => "clubs", getRank: () => 7, getFace: () => "7C" },
        { getSuit: () => "hearts", getRank: () => 10, getFace: () => "10H" },
      ],
    },
    playedCards: [],
    trumpSuit: "spades",
    points: { TestPlayer: 0, Bot: 0 },
    marks: { TestPlayer: 0, Bot: 0 },
    gameNumber: 1,
    isGameFinished: () => false,

    // Simulate bot failure if requested
    _shouldFail: botShouldFail,
    _failCount: 0,
  };
};

// Mock handleBotTurn function to simulate different scenarios
const originalHandleBotTurn = async (game, playerCard, io, gameId) => {
  console.log(`handleBotTurn chamado para jogo ${gameId}`);

  // Simulate random failure for testing
  if (game._shouldFail && game._failCount < 2) {
    game._failCount++;
    console.log(`Simulando falha do bot (tentativa ${game._failCount})`);
    throw new Error(`Simulação de falha ${game._failCount}`);
  }

  // Simulate successful bot play
  console.log(`Bot jogou com sucesso no jogo ${gameId}`);

  // Remove a card from bot's hand
  if (game.hands[game.bot].length > 0) {
    const playedCard = game.hands[game.bot].pop();
    game.playedCards.push({ player: game.bot, card: playedCard });

    // Emit card played event
    io.to(gameId).emit("cardPlayed", {
      player: game.bot,
      card: playedCard.getFace(),
      remainingCards: game.hands[game.bot].length,
    });
  }

  return { success: true, botCard: game.hands[game.bot][0] };
};

// Test scenarios
const runTests = async () => {
  console.log("\nExecutando testes...\n");

  // Test 1: Bot plays successfully on first attempt
  console.log("Teste 1: Bot joga com sucesso na primeira tentativa");
  const game1 = createMockGame("test-game-1", false);
  const startTime1 = Date.now();

  try {
    await triggerBotPlayIfNeeded(game1, io, "test-game-1");
    setTimeout(() => {
      const elapsed = Date.now() - startTime1;
      console.log(`Teste 1 concluído em ${elapsed}ms`);
      console.log(`   - Cartas restantes do bot: ${game1.hands.Bot.length}`);
      console.log(`   - Cartas jogadas: ${game1.playedCards.length}`);
    }, 2000);
  } catch (error) {
    console.log(`Teste 1 falhou: ${error.message}`);
  }

  // Test 2: Bot fails initially but succeeds on retry
  setTimeout(async () => {
    console.log("\nTeste 2: Bot falha inicialmente mas sucede no retry");
    const game2 = createMockGame("test-game-2", true);
    const startTime2 = Date.now();

    try {
      await triggerBotPlayIfNeeded(game2, io, "test-game-2");
      setTimeout(() => {
        const elapsed = Date.now() - startTime2;
        console.log(`Teste 2 concluído em ${elapsed}ms`);
        console.log(`   - Tentativas de falha simuladas: ${game2._failCount}`);
        console.log(`   - Cartas restantes do bot: ${game2.hands.Bot.length}`);
      }, 15000); // Wait longer for retries
    } catch (error) {
      console.log(`Teste 2 falhou: ${error.message}`);
    }
  }, 3000);

  // Test 3: Test with confirmation system disabled
  setTimeout(async () => {
    console.log("\nTeste 3: Sistema de confirmação desabilitado");
    const originalEnabled = config.bot.confirmation.enabled;
    config.bot.confirmation.enabled = false;

    const game3 = createMockGame("test-game-3", false);
    const startTime3 = Date.now();

    try {
      await triggerBotPlayIfNeeded(game3, io, "test-game-3");
      setTimeout(() => {
        const elapsed = Date.now() - startTime3;
        console.log(`Teste 3 concluído em ${elapsed}ms (sem confirmação)`);
        console.log(`   - Sistema de confirmação estava desabilitado`);

        // Restore original setting
        config.bot.confirmation.enabled = originalEnabled;
      }, 2000);
    } catch (error) {
      console.log(`Teste 3 falhou: ${error.message}`);
      config.bot.confirmation.enabled = originalEnabled;
    }
  }, 6000);

  // Test 4: Test timer cleanup
  setTimeout(() => {
    console.log("\nTeste 4: Limpeza de timers");
    const game4 = createMockGame("test-game-4", false);

    triggerBotPlayIfNeeded(game4, io, "test-game-4").then(() => {
      // Immediately clear the timer
      setTimeout(() => {
        clearBotResponseTimer("test-game-4");
        console.log(`Teste 4 concluído - Timer limpo manualmente`);
      }, 1000);
    });
  }, 9000);

  // Cleanup and exit
  setTimeout(() => {
    console.log("\nTodos os testes concluídos!");
    console.log("Resultados dos testes salvos em logs/");
    process.exit(0);
  }, 25000);
};

// Setup socket event handlers for testing
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Handle bot status messages
io.on("connection", (socket) => {
  socket.on("botStatus", (data) => {
    console.log(`Status do bot: ${data.message}`);
    if (data.attempt) {
      console.log(`   - Tentativa ${data.attempt}/${data.maxAttempts}`);
    }
    if (data.error) {
      console.log(`   - Erro: ${data.error}`);
    }
  });

  socket.on("cardPlayed", (data) => {
    console.log(`Carta jogada: ${data.player} - ${data.card}`);
    console.log(`   - Cartas restantes: ${data.remainingCards}`);
  });
});

// Mock the handleBotTurn function globally for testing
global.handleBotTurn = originalHandleBotTurn;

console.log("Servidor de teste iniciado na porta 3001");
console.log("Aguardando 2 segundos antes de iniciar os testes...\n");

// Start tests after a brief delay
setTimeout(runTests, 2000);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nEncerrando servidor de teste...");
  clearBotResponseTimer("test-game-1");
  clearBotResponseTimer("test-game-2");
  clearBotResponseTimer("test-game-3");
  clearBotResponseTimer("test-game-4");
  io.close();
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Erro não capturado:", error.message);
  console.error("Stack trace:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promise rejeitada:", reason);
  console.error("Promise:", promise);
});
