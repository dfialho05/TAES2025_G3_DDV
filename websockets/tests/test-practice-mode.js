#!/usr/bin/env node
// test-practice-mode.js
import { Server } from "socket.io";
import { createServer } from "http";
import { io as Client } from "socket.io-client";
import { connectionsHandlers } from "../events/connections.js";
import { gameHandlers } from "../events/game.js";
import * as ConnectionState from "../state/connections.js";
import * as GameState from "../state/game.js";

console.log("🧪 TESTES UNITÁRIOS: Practice Mode");
console.log("=".repeat(50));

// Configuração do servidor de teste
let server, ioServer, clientSocket;
const TEST_PORT = 3002;

// Mock das funções de Laravel API para não tentar conectar à BD real
const mockLaravelAPI = async () => {
  try {
    const LaravelAPI = await import("../services/laravel.js");

    // Salvar referências originais
    const original = {
      createMatch: LaravelAPI.createMatch,
      createGameForMatch: LaravelAPI.createGameForMatch,
      createStandaloneGame: LaravelAPI.createStandaloneGame,
      finishGame: LaravelAPI.finishGame,
      finishMatch: LaravelAPI.finishMatch,
    };

    // Mock das funções para retornar valores fake
    LaravelAPI.createMatch = async () => ({ id: "mock-match-id" });
    LaravelAPI.createGameForMatch = async () => "mock-game-id";
    LaravelAPI.createStandaloneGame = async () => "mock-standalone-game-id";
    LaravelAPI.finishGame = async () => true;
    LaravelAPI.finishMatch = async () => true;

    return original;
  } catch {
    console.log("⚠️ Laravel API não encontrada, prosseguindo com mocks");
    return {};
  }
};

function setupTestServer() {
  return new Promise((resolve) => {
    server = createServer();
    ioServer = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Configurar handlers como no index.js real
    ioServer.on("connection", async (socket) => {
      const token = socket.handshake.auth.token;
      socket.data.token = token;

      if (!token) {
        // Criar usuário anônimo para practice mode
        const anonymousUser = {
          id: `anon_${socket.id}`,
          name: "Guest Player",
          token: null,
        };
        ConnectionState.addUser(socket.id, anonymousUser);
      }

      connectionsHandlers(ioServer, socket);
      gameHandlers(ioServer, socket);
    });

    server.listen(TEST_PORT, () => {
      console.log(`🔧 Servidor de teste iniciado na porta ${TEST_PORT}`);
      resolve();
    });
  });
}

function teardownTestServer() {
  return new Promise((resolve) => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (ioServer) {
      ioServer.close();
    }
    if (server) {
      server.close();
    }
    console.log("🔧 Servidor de teste fechado");
    resolve();
  });
}

function createAnonymousClient() {
  return new Promise((resolve) => {
    clientSocket = Client(`http://localhost:${TEST_PORT}`, {
      auth: { token: null },
    });
    clientSocket.on("connect", () => {
      console.log("🔌 Cliente anônimo conectado");
      resolve(clientSocket);
    });
  });
}

function createAuthenticatedClient() {
  return new Promise((resolve) => {
    clientSocket = Client(`http://localhost:${TEST_PORT}`, {
      auth: { token: "mock-user-token" },
    });
    clientSocket.on("connect", () => {
      console.log("🔌 Cliente autenticado conectado");
      // Simular join de usuário autenticado
      clientSocket.emit("join", { id: "auth-user-1", name: "AuthUser1" });
      resolve(clientSocket);
    });
  });
}

function waitForEvent(socket, eventName, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function testAnonymousUserCreation() {
  console.log("\n👤 TESTE: Criação de usuário anônimo");
  console.log("-".repeat(40));

  let passed = true;
  let client;

  try {
    // Conectar sem token
    client = await createAnonymousClient();

    // Aguardar processamento
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar se usuário anônimo foi criado
    const user = ConnectionState.getUser(client.id);

    if (!user) {
      console.log("❌ Usuário anônimo não foi criado");
      passed = false;
    } else if (!user.id.startsWith("anon_")) {
      console.log("❌ ID do usuário anônimo não tem prefixo correto:", user.id);
      passed = false;
    } else if (user.name !== "Guest Player") {
      console.log("❌ Nome do usuário anônimo incorreto:", user.name);
      passed = false;
    } else if (user.token !== null) {
      console.log("❌ Token do usuário anônimo deveria ser null:", user.token);
      passed = false;
    } else {
      console.log("✅ Usuário anônimo criado corretamente:", user);
    }
  } catch (error) {
    console.log(
      "❌ Erro no teste de criação de usuário anônimo:",
      error.message,
    );
    passed = false;
  } finally {
    if (client) client.disconnect();
  }

  return passed;
}

async function testPracticeGameCreation() {
  console.log("\n🎯 TESTE: Criação de jogo practice");
  console.log("-".repeat(40));

  let passed = true;
  let client;

  try {
    client = await createAnonymousClient();

    // Aguardar usuário anônimo ser criado
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Criar jogo practice
    console.log("📤 Enviando create-game com practice=true...");
    client.emit("create-game", 3, "singleplayer", 1, true);

    // Aguardar resposta do jogo
    const gameState = await waitForEvent(client, "game-joined");

    if (!gameState) {
      console.log("❌ Não recebeu estado do jogo");
      passed = false;
    } else if (!gameState.id) {
      console.log("❌ Jogo não tem ID:", gameState);
      passed = false;
    } else {
      console.log("✅ Jogo practice criado com sucesso, ID:", gameState.id);

      // Verificar se o jogo foi adicionado ao GameState
      const game = GameState.getGame(gameState.id);
      if (!game) {
        console.log("❌ Jogo não encontrado no GameState");
        passed = false;
      } else {
        console.log("✅ Jogo encontrado no GameState");

        // Verificar se é modo singleplayer
        if (game.mode !== "singleplayer") {
          console.log("❌ Modo do jogo incorreto:", game.mode);
          passed = false;
        } else {
          console.log("✅ Modo singleplayer confirmado");
        }

        // Verificar se target wins está correto
        if (game.winsNeeded !== 1) {
          console.log("❌ Target wins incorreto:", game.winsNeeded);
          passed = false;
        } else {
          console.log("✅ Target wins correto");
        }
      }
    }
  } catch (error) {
    console.log("❌ Erro no teste de criação de jogo practice:", error.message);
    passed = false;
  } finally {
    if (client) client.disconnect();
  }

  return passed;
}

async function testPracticeVsNormalGameCreation() {
  console.log("\n🔄 TESTE: Practice vs Normal game creation");
  console.log("-".repeat(45));

  let passed = true;
  let anonymousClient, authClient;

  try {
    // Teste 1: Cliente anônimo cria jogo practice
    console.log("🎯 Testando jogo practice (anônimo)...");
    anonymousClient = await createAnonymousClient();
    await new Promise((resolve) => setTimeout(resolve, 100));

    anonymousClient.emit("create-game", 3, "singleplayer", 1, true);
    const practiceGameState = await waitForEvent(
      anonymousClient,
      "game-joined",
    );

    if (!practiceGameState || !practiceGameState.id) {
      console.log("❌ Falha na criação do jogo practice");
      passed = false;
    } else {
      console.log("✅ Jogo practice criado:", practiceGameState.id);
    }

    // Teste 2: Cliente autenticado cria jogo normal
    console.log("🏆 Testando jogo normal (autenticado)...");
    authClient = await createAuthenticatedClient();
    await new Promise((resolve) => setTimeout(resolve, 100));

    authClient.emit("create-game", 3, "singleplayer", 1, false);
    const normalGameState = await waitForEvent(authClient, "game-joined");

    if (!normalGameState || !normalGameState.id) {
      console.log("❌ Falha na criação do jogo normal");
      passed = false;
    } else {
      console.log("✅ Jogo normal criado:", normalGameState.id);
    }

    // Verificar que os IDs são diferentes
    if (practiceGameState.id === normalGameState.id) {
      console.log("❌ IDs dos jogos são iguais, devem ser únicos");
      passed = false;
    } else {
      console.log("✅ IDs dos jogos são únicos");
    }
  } catch (error) {
    console.log("❌ Erro no teste practice vs normal:", error.message);
    passed = false;
  } finally {
    if (anonymousClient) anonymousClient.disconnect();
    if (authClient) authClient.disconnect();
  }

  return passed;
}

async function testPracticeGameplay() {
  console.log("\n🎮 TESTE: Gameplay em modo practice");
  console.log("-".repeat(40));

  let passed = true;
  let client;

  try {
    client = await createAnonymousClient();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Criar jogo practice
    client.emit("create-game", 3, "singleplayer", 1, true);
    const gameState = await waitForEvent(client, "game-joined");

    if (
      !gameState ||
      !gameState.player1Hand ||
      gameState.player1Hand.length === 0
    ) {
      console.log("❌ Estado inicial do jogo inválido");
      passed = false;
      return passed;
    }

    console.log(
      "✅ Jogo iniciado, cartas na mão:",
      gameState.player1Hand.length,
    );

    // Tentar jogar uma carta
    console.log("🎴 Tentando jogar primeira carta...");
    client.emit("play_card", { gameID: gameState.id, cardIndex: 0 });

    // Aguardar resposta do jogo
    const updatedState = await waitForEvent(client, "game_state");

    if (!updatedState) {
      console.log("❌ Não recebeu estado atualizado após jogar carta");
      passed = false;
    } else {
      console.log("✅ Recebeu estado atualizado do jogo");

      // Verificar se a carta foi jogada (tableCards deve ter pelo menos 1 carta)
      if (!updatedState.tableCards || updatedState.tableCards.length === 0) {
        console.log("❌ Carta não apareceu na mesa");
        passed = false;
      } else {
        console.log(
          "✅ Carta jogada com sucesso, cartas na mesa:",
          updatedState.tableCards.length,
        );
      }
    }
  } catch (error) {
    console.log("❌ Erro no teste de gameplay practice:", error.message);
    passed = false;
  } finally {
    if (client) client.disconnect();
  }

  return passed;
}

async function testMultiplePracticeGames() {
  console.log("\n🔢 TESTE: Múltiplos jogos practice simultâneos");
  console.log("-".repeat(45));

  let passed = true;
  const clients = [];

  try {
    const numClients = 3;
    const gameIds = [];

    // Criar múltiplos clientes anônimos
    for (let i = 0; i < numClients; i++) {
      const client = Client(`http://localhost:${TEST_PORT}`, {
        auth: { token: null },
      });

      await new Promise((resolve) => {
        client.on("connect", resolve);
      });

      clients.push(client);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Cada cliente cria um jogo practice
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      console.log(`🎯 Cliente ${i + 1} criando jogo practice...`);

      client.emit("create-game", 3, "singleplayer", 1, true);
      const gameState = await waitForEvent(client, "game-joined");

      if (!gameState || !gameState.id) {
        console.log(`❌ Cliente ${i + 1} falhou ao criar jogo`);
        passed = false;
      } else {
        gameIds.push(gameState.id);
        console.log(`✅ Cliente ${i + 1} criou jogo:`, gameState.id);
      }
    }

    // Verificar que todos os IDs são únicos
    const uniqueIds = new Set(gameIds);
    if (uniqueIds.size !== gameIds.length) {
      console.log("❌ IDs dos jogos não são únicos:", gameIds);
      passed = false;
    } else {
      console.log("✅ Todos os jogos têm IDs únicos");
    }

    // Verificar que todos os jogos existem no GameState
    for (const gameId of gameIds) {
      const game = GameState.getGame(gameId);
      if (!game) {
        console.log("❌ Jogo não encontrado no GameState:", gameId);
        passed = false;
      }
    }

    if (passed) {
      console.log(
        "✅ Todos os jogos practice criados simultaneamente com sucesso",
      );
    }
  } catch (error) {
    console.log("❌ Erro no teste de múltiplos jogos practice:", error.message);
    passed = false;
  } finally {
    // Limpar todos os clientes
    for (const client of clients) {
      if (client) client.disconnect();
    }
  }

  return passed;
}

async function testPracticeGameCleanup() {
  console.log("\n🧹 TESTE: Limpeza de jogos practice");
  console.log("-".repeat(40));

  let passed = true;
  let client;

  try {
    client = await createAnonymousClient();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Criar jogo practice
    client.emit("create-game", 3, "singleplayer", 1, true);
    const gameState = await waitForEvent(client, "game-joined");
    const gameId = gameState.id;

    // Verificar que o jogo existe
    let game = GameState.getGame(gameId);
    if (!game) {
      console.log("❌ Jogo não foi criado");
      passed = false;
      return passed;
    }

    console.log("✅ Jogo criado:", gameId);

    // Desconectar cliente
    client.emit("leave_game", gameId);
    client.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // O jogo ainda deve existir (só é removido quando termina completamente)
    game = GameState.getGame(gameId);
    if (!game) {
      console.log(
        "⚠️ Jogo foi removido após leave_game (comportamento pode variar)",
      );
    } else {
      console.log("✅ Jogo ainda existe após leave_game");
    }
  } catch (error) {
    console.log("❌ Erro no teste de limpeza:", error.message);
    passed = false;
  } finally {
    if (client && client.connected) {
      client.disconnect();
    }
  }

  return passed;
}

async function runAllPracticeTests() {
  console.log("\n🚀 EXECUTANDO TODOS OS TESTES DE PRACTICE MODE");
  console.log("=".repeat(55));

  // Setup mocks
  await mockLaravelAPI();

  const tests = [
    { name: "Criação de usuário anônimo", fn: testAnonymousUserCreation },
    { name: "Criação de jogo practice", fn: testPracticeGameCreation },
    { name: "Practice vs Normal games", fn: testPracticeVsNormalGameCreation },
    { name: "Gameplay em practice mode", fn: testPracticeGameplay },
    { name: "Múltiplos jogos practice", fn: testMultiplePracticeGames },
    { name: "Limpeza de jogos practice", fn: testPracticeGameCleanup },
  ];

  let totalTests = tests.length;
  let passedTests = 0;

  await setupTestServer();

  for (const test of tests) {
    console.log(`\n🔄 Executando: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ PASSOU: ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ FALHOU: ${test.name}`);
      }
    } catch (error) {
      console.log(`❌ ERRO: ${test.name} - ${error.message}`);
    }

    // Pequena pausa entre testes
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await teardownTestServer();

  console.log("\n📊 RESULTADOS DOS TESTES PRACTICE MODE");
  console.log("=".repeat(45));
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Testes passaram: ${passedTests}`);
  console.log(`Testes falharam: ${totalTests - passedTests}`);
  console.log(
    `Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
  );

  if (passedTests === totalTests) {
    console.log("\n🎉 TODOS OS TESTES DE PRACTICE MODE PASSARAM! 🎉");
    return true;
  } else {
    console.log("\n⚠️ Alguns testes falharam. Verifique os logs acima.");
    return false;
  }
}

// Executar os testes se este arquivo for chamado diretamente
if (process.argv[1].endsWith("test-practice-mode.js")) {
  runAllPracticeTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Erro fatal nos testes:", error);
      process.exit(1);
    });
}

export { runAllPracticeTests };
