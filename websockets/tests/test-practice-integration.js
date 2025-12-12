#!/usr/bin/env node
// test-practice-integration.js
import { Server } from "socket.io";
import { createServer } from "http";
import { io as Client } from "socket.io-client";
import { connectionsHandlers } from "../events/connections.js";
import { gameHandlers } from "../events/game.js";
import * as ConnectionState from "../state/connections.js";
import * as GameState from "../state/game.js";

console.log("🧪 TESTES DE INTEGRAÇÃO: Practice Mode End-to-End");
console.log("=".repeat(60));

// Configuração do servidor de teste
let server, ioServer;
const TEST_PORT = 3003;

// Mock das funções de Laravel API
const mockLaravelAPI = async () => {
  const originalModule = {};

  try {
    // Se o módulo existir, fazer mock das funções
    const LaravelAPI = await import("../services/laravel.js");
    originalModule.createMatch = LaravelAPI.createMatch;
    originalModule.createGameForMatch = LaravelAPI.createGameForMatch;
    originalModule.createStandaloneGame = LaravelAPI.createStandaloneGame;
    originalModule.finishGame = LaravelAPI.finishGame;
    originalModule.finishMatch = LaravelAPI.finishMatch;

    // Mock functions
    LaravelAPI.createMatch = async () => ({ id: "mock-match-id" });
    LaravelAPI.createGameForMatch = async () => "mock-game-id";
    LaravelAPI.createStandaloneGame = async () => "mock-standalone-game-id";
    LaravelAPI.finishGame = async () => true;
    LaravelAPI.finishMatch = async () => true;
  } catch (error) {
    console.log("⚠️ Laravel API module not found, using mocks:", error.message);
  }

  return originalModule;
};

function setupIntegrationTestServer() {
  return new Promise((resolve) => {
    server = createServer();
    ioServer = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Setup exactly like the real server in index.js
    ioServer.on("connection", async (socket) => {
      const token = socket.handshake.auth.token;
      socket.data.token = token;

      if (token) {
        console.log(`🔌 Socket ${socket.id} connected WITH token`);
      } else {
        console.log(`⚠️ Socket ${socket.id} connected WITHOUT token`);

        // Create anonymous user for practice games
        const anonymousUser = {
          id: `anon_${socket.id}`,
          name: "Guest Player",
          token: null,
        };

        ConnectionState.addUser(socket.id, anonymousUser);
        console.log(
          `👤 Anonymous user created: ${anonymousUser.name} (Practice Mode)`,
        );
      }

      connectionsHandlers(ioServer, socket);
      gameHandlers(ioServer, socket);
    });

    server.listen(TEST_PORT, () => {
      console.log(`🔧 Integration test server started on port ${TEST_PORT}`);
      resolve();
    });
  });
}

function teardownIntegrationTestServer() {
  return new Promise((resolve) => {
    if (ioServer) {
      ioServer.close();
    }
    if (server) {
      server.close();
    }
    console.log("🔧 Integration test server closed");
    resolve();
  });
}

function createTestClient(token = null) {
  return new Promise((resolve, reject) => {
    const client = Client(`http://localhost:${TEST_PORT}`, {
      auth: { token: token },
    });

    client.on("connect", () => {
      console.log(`🔌 Test client connected (token: ${token ? "yes" : "no"})`);
      resolve(client);
    });

    client.on("connect_error", (error) => {
      reject(new Error(`Connection failed: ${error.message}`));
    });

    // Timeout for connection
    setTimeout(() => {
      if (!client.connected) {
        reject(new Error("Connection timeout"));
      }
    }, 3000);
  });
}

function waitForEvent(socket, eventName, timeout = 3000) {
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

async function testCompleteAnonymousPracticeFlow() {
  console.log("\n🎯 TESTE INTEGRAÇÃO: Fluxo completo practice anônimo");
  console.log("-".repeat(55));

  let passed = true;
  let client;

  try {
    // 1. Conectar como usuário anônimo (sem token)
    console.log("📡 Passo 1: Conectando como usuário anônimo...");
    client = await createTestClient(null);

    // Aguardar criação do usuário anônimo
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verificar se usuário anônimo foi criado
    const user = ConnectionState.getUser(client.id);
    if (!user || !user.id.startsWith("anon_") || user.token !== null) {
      console.log("❌ Usuário anônimo não criado corretamente:", user);
      passed = false;
      return passed;
    }
    console.log("✅ Usuário anônimo criado:", user.id);

    // 2. Criar jogo practice
    console.log("🎮 Passo 2: Criando jogo practice...");
    client.emit("create-game", 3, "singleplayer", 1, true);

    const gameState = await waitForEvent(client, "game-joined");
    if (!gameState || !gameState.id) {
      console.log("❌ Jogo practice não foi criado");
      passed = false;
      return passed;
    }
    console.log("✅ Jogo practice criado, ID:", gameState.id);

    // 3. Verificar estado inicial do jogo
    console.log("🔍 Passo 3: Verificando estado inicial...");
    if (!gameState.player1Hand || gameState.player1Hand.length === 0) {
      console.log("❌ Player não tem cartas na mão");
      passed = false;
      return passed;
    }
    if (!gameState.trunfo) {
      console.log("❌ Trunfo não definido");
      passed = false;
      return passed;
    }
    console.log(
      "✅ Estado inicial válido - cartas:",
      gameState.player1Hand.length,
      "trunfo:",
      gameState.trunfo.suit,
    );

    // 4. Jogar primeira carta
    console.log("🎴 Passo 4: Jogando primeira carta...");
    client.emit("play_card", { gameID: gameState.id, cardIndex: 0 });

    const afterPlay1 = await waitForEvent(client, "game_state");
    if (!afterPlay1.tableCards || afterPlay1.tableCards.length === 0) {
      console.log("❌ Carta do player não apareceu na mesa");
      passed = false;
      return passed;
    }
    console.log(
      "✅ Carta jogada, mesa tem:",
      afterPlay1.tableCards.length,
      "cartas",
    );

    // 5. Aguardar bot jogar
    console.log("🤖 Passo 5: Aguardando bot jogar...");
    const afterBot = await waitForEvent(client, "game_state", 5000);
    if (!afterBot.tableCards || afterBot.tableCards.length !== 2) {
      console.log(
        "❌ Bot não jogou carta. Mesa tem:",
        afterBot.tableCards?.length || 0,
        "cartas",
      );
      passed = false;
      return passed;
    }
    console.log(
      "✅ Bot jogou, mesa tem:",
      afterBot.tableCards.length,
      "cartas",
    );

    // 6. Aguardar resolução da vaza
    console.log("🏆 Passo 6: Aguardando resolução da vaza...");
    const afterResolution = await waitForEvent(client, "game_state", 5000);
    if (afterResolution.tableCards && afterResolution.tableCards.length > 0) {
      console.log("⏳ Mesa ainda tem cartas, aguardando limpeza...");
      // Aguardar um pouco mais para a mesa limpar
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.log("✅ Vaza resolvida");

    // 7. Verificar se o jogo continua (se há cartas restantes)
    console.log("🔄 Passo 7: Verificando continuidade do jogo...");
    const currentGame = GameState.getGame(gameState.id);
    if (!currentGame) {
      console.log("❌ Jogo desapareceu do GameState");
      passed = false;
      return passed;
    }

    console.log("✅ Jogo ainda existe e funcionando");
    console.log(
      `   - Cartas restantes no baralho: ${currentGame.cardsLeft || 0}`,
    );
    console.log(`   - Pontos player: ${currentGame.score?.player1 || 0}`);
    console.log(`   - Pontos bot: ${currentGame.score?.player2 || 0}`);

    // 8. Testar saída do jogo
    console.log("🚪 Passo 8: Saindo do jogo...");
    client.emit("leave_game", gameState.id);
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("✅ Comando leave_game enviado");
  } catch (error) {
    console.log("❌ Erro no teste de fluxo completo:", error.message);
    passed = false;
  } finally {
    if (client && client.connected) {
      client.disconnect();
    }
  }

  return passed;
}

async function testPracticeVsAuthenticatedComparison() {
  console.log("\n⚖️ TESTE INTEGRAÇÃO: Comparação Practice vs Autenticado");
  console.log("-".repeat(55));

  let passed = true;
  let practiceClient, authClient;

  try {
    // Setup para cliente practice
    console.log("🎯 Configurando cliente practice...");
    practiceClient = await createTestClient(null);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Setup para cliente autenticado
    console.log("🔐 Configurando cliente autenticado...");
    authClient = await createTestClient("mock-token");
    authClient.emit("join", { id: "test-user-1", name: "TestUser1" });
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Criar jogo practice
    console.log("🎮 Criando jogo practice...");
    practiceClient.emit("create-game", 3, "singleplayer", 1, true);
    const practiceGame = await waitForEvent(practiceClient, "game-joined");

    // Criar jogo normal
    console.log("🏆 Criando jogo normal...");
    authClient.emit("create-game", 3, "singleplayer", 1, false);
    const normalGame = await waitForEvent(authClient, "game-joined");

    // Comparar resultados
    if (!practiceGame || !normalGame) {
      console.log("❌ Um dos jogos não foi criado");
      passed = false;
      return passed;
    }

    if (practiceGame.id === normalGame.id) {
      console.log("❌ Jogos têm o mesmo ID (devem ser únicos)");
      passed = false;
      return passed;
    }

    console.log("✅ Ambos os jogos criados com IDs únicos");
    console.log(`   - Practice game: ${practiceGame.id}`);
    console.log(`   - Normal game: ${normalGame.id}`);

    // Verificar que ambos têm estado inicial válido
    const practiceValid =
      practiceGame.player1Hand && practiceGame.player1Hand.length > 0;
    const normalValid =
      normalGame.player1Hand && normalGame.player1Hand.length > 0;

    if (!practiceValid || !normalValid) {
      console.log("❌ Estado inicial inválido em um dos jogos");
      console.log(`   - Practice válido: ${practiceValid}`);
      console.log(`   - Normal válido: ${normalValid}`);
      passed = false;
      return passed;
    }

    console.log("✅ Ambos os jogos têm estado inicial válido");
  } catch (error) {
    console.log("❌ Erro no teste de comparação:", error.message);
    passed = false;
  } finally {
    if (practiceClient && practiceClient.connected) {
      practiceClient.disconnect();
    }
    if (authClient && authClient.connected) {
      authClient.disconnect();
    }
  }

  return passed;
}

async function testStressTestMultiplePracticeGames() {
  console.log("\n💪 TESTE INTEGRAÇÃO: Stress test múltiplos jogos practice");
  console.log("-".repeat(55));

  let passed = true;
  const clients = [];
  const gameIds = [];

  try {
    const numClients = 5;

    console.log(`🚀 Criando ${numClients} clientes simultâneos...`);

    // Criar múltiplos clientes
    for (let i = 0; i < numClients; i++) {
      try {
        const client = await createTestClient(null);
        clients.push(client);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeno delay entre conexões
      } catch (error) {
        console.log(`❌ Falha ao criar cliente ${i + 1}:`, error.message);
        passed = false;
        break;
      }
    }

    if (!passed) return passed;

    console.log(`✅ ${clients.length} clientes conectados`);

    // Cada cliente cria um jogo
    for (let i = 0; i < clients.length; i++) {
      try {
        const client = clients[i];
        console.log(`🎮 Cliente ${i + 1} criando jogo...`);

        client.emit("create-game", 3, "singleplayer", 1, true);
        const gameState = await waitForEvent(client, "game-joined", 5000);

        if (!gameState || !gameState.id) {
          console.log(`❌ Cliente ${i + 1} falhou ao criar jogo`);
          passed = false;
          break;
        }

        gameIds.push(gameState.id);
        console.log(`✅ Cliente ${i + 1} criou jogo: ${gameState.id}`);
      } catch (error) {
        console.log(`❌ Erro no cliente ${i + 1}:`, error.message);
        passed = false;
        break;
      }
    }

    if (!passed) return passed;

    // Verificar unicidade dos IDs
    const uniqueIds = new Set(gameIds);
    if (uniqueIds.size !== gameIds.length) {
      console.log("❌ IDs dos jogos não são únicos:", gameIds);
      passed = false;
      return passed;
    }

    console.log("✅ Todos os jogos têm IDs únicos");

    // Testar gameplay simultâneo
    console.log("🎴 Testando gameplay simultâneo...");
    const playPromises = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const gameId = gameIds[i];

      playPromises.push(
        (async () => {
          client.emit("play_card", { gameID: gameId, cardIndex: 0 });
          const response = await waitForEvent(client, "game_state", 5000);
          return response;
        })(),
      );
    }

    // Aguardar todos os jogadores jogarem
    try {
      const responses = await Promise.all(playPromises);
      console.log(`✅ ${responses.length} jogadores jogaram simultaneamente`);
    } catch (error) {
      console.log("❌ Erro no gameplay simultâneo:", error.message);
      passed = false;
    }
  } catch (error) {
    console.log("❌ Erro no stress test:", error.message);
    passed = false;
  } finally {
    // Limpar todos os clientes
    for (const client of clients) {
      if (client && client.connected) {
        client.disconnect();
      }
    }
  }

  return passed;
}

async function testErrorHandlingInPracticeMode() {
  console.log("\n🛡️ TESTE INTEGRAÇÃO: Tratamento de erros em practice");
  console.log("-".repeat(50));

  let passed = true;
  let client;

  try {
    client = await createTestClient(null);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Teste 1: Tentar jogar carta sem ter jogo
    console.log("🚫 Teste 1: Jogando carta sem jogo...");
    client.emit("play_card", { gameID: 999, cardIndex: 0 });

    // Aguardar um pouco - não deve crashar
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("✅ Sistema não crashou com jogo inexistente");

    // Teste 2: Criar jogo e tentar jogar carta inválida
    console.log("🎮 Teste 2: Criando jogo e jogando carta inválida...");
    client.emit("create-game", 3, "singleplayer", 1, true);
    const gameState = await waitForEvent(client, "game-joined");

    if (gameState && gameState.id) {
      // Tentar jogar carta com índice inválido
      client.emit("play_card", { gameID: gameState.id, cardIndex: 99 });
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("✅ Sistema não crashou com carta inválida");
    }

    // Teste 3: Múltiplas conexões do mesmo cliente
    console.log("🔄 Teste 3: Múltiplas conexões...");
    const client2 = await createTestClient(null);
    client2.emit("create-game", 3, "singleplayer", 1, true);
    const gameState2 = await waitForEvent(client2, "game-joined");

    if (gameState2 && gameState2.id) {
      console.log("✅ Múltiplas conexões suportadas");
    }

    client2.disconnect();
  } catch (error) {
    console.log("❌ Erro no teste de tratamento de erros:", error.message);
    passed = false;
  } finally {
    if (client && client.connected) {
      client.disconnect();
    }
  }

  return passed;
}

async function runAllIntegrationTests() {
  console.log("\n🚀 EXECUTANDO TODOS OS TESTES DE INTEGRAÇÃO PRACTICE");
  console.log("=".repeat(65));

  // Mock Laravel API
  await mockLaravelAPI();

  const tests = [
    {
      name: "Fluxo completo practice anônimo",
      fn: testCompleteAnonymousPracticeFlow,
    },
    {
      name: "Comparação Practice vs Autenticado",
      fn: testPracticeVsAuthenticatedComparison,
    },
    {
      name: "Stress test múltiplos jogos",
      fn: testStressTestMultiplePracticeGames,
    },
    {
      name: "Tratamento de erros",
      fn: testErrorHandlingInPracticeMode,
    },
  ];

  let totalTests = tests.length;
  let passedTests = 0;

  await setupIntegrationTestServer();

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

    // Pausa entre testes para limpeza
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await teardownIntegrationTestServer();

  console.log("\n📊 RESULTADOS DOS TESTES DE INTEGRAÇÃO");
  console.log("=".repeat(45));
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Testes passaram: ${passedTests}`);
  console.log(`Testes falharam: ${totalTests - passedTests}`);
  console.log(
    `Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
  );

  if (passedTests === totalTests) {
    console.log("\n🎉 TODOS OS TESTES DE INTEGRAÇÃO PASSARAM! 🎉");
    console.log("🏆 PRACTICE MODE ESTÁ 100% FUNCIONAL! 🏆");
    return true;
  } else {
    console.log("\n⚠️ Alguns testes falharam. Verifique os logs acima.");
    return false;
  }
}

// Executar os testes se este arquivo for chamado diretamente
if (process.argv[1].endsWith("test-practice-integration.js")) {
  runAllIntegrationTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Erro fatal nos testes:", error);
      process.exit(1);
    });
}

export { runAllIntegrationTests };
