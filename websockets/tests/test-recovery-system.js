import { io as ioClient } from "socket.io-client";
import {
  saveGameState,
  getGameState,
  mapPlayerToGame,
  getPlayerGame,
  updateGameHeartbeat,
  getGameHeartbeat,
  deleteGameState,
  getAllActiveGames,
  findOrphanedGames,
} from "../redis/gameStateManager.js";
import { checkRedisHealth } from "../redis/client.js";

// Configuração
const SERVER_URL = "http://localhost:3000";
const TEST_DELAY = 1000;

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, colors.green);
const error = (message) => log(`❌ ${message}`, colors.red);
const info = (message) => log(`ℹ️  ${message}`, colors.cyan);
// const warn = (message) => log(`⚠️  ${message}`, colors.yellow);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assert = (condition, testName) => {
  if (condition) {
    success(`PASS: ${testName}`);
    testsPassed++;
    return true;
  } else {
    error(`FAIL: ${testName}`);
    testsFailed++;
    return false;
  }
};

// Test Suite
const runTests = async () => {
  log("\n" + "=".repeat(70), colors.blue);
  log("🧪 TESTE DO SISTEMA DE RECUPERAÇÃO E RESILIÊNCIA", colors.blue);
  log("=".repeat(70) + "\n", colors.blue);

  try {
    // Test 1: Redis Health Check
    log("\n📋 Teste 1: Verificação de Saúde do Redis", colors.cyan);
    const redisHealthy = await checkRedisHealth();
    assert(redisHealthy, "Redis deve estar conectado e respondendo");

    if (!redisHealthy) {
      error("❌ Redis não está disponível. Encerrando testes.");
      process.exit(1);
    }

    await sleep(TEST_DELAY);

    // Test 2: Save and Retrieve Game State
    log("\n📋 Teste 2: Salvar e Recuperar Estado do Jogo", colors.cyan);
    const testGameId = 9999;
    const testGameState = {
      id: testGameId,
      player1: { id: "test_player_1", name: "Test Player 1" },
      player2: { id: "test_player_2", name: "Test Player 2" },
      turn: "player1",
      gameOver: false,
      mode: "multiplayer",
      timestamp: Date.now(),
    };

    const saved = await saveGameState(testGameId, testGameState, 300);
    assert(saved, "Estado do jogo deve ser salvo com sucesso");

    const retrieved = await getGameState(testGameId);
    assert(retrieved !== null, "Estado do jogo deve ser recuperado");
    assert(
      retrieved.id === testGameId,
      "ID do jogo recuperado deve corresponder",
    );
    assert(
      retrieved.player1.id === "test_player_1",
      "Dados do Player 1 devem estar corretos",
    );

    await sleep(TEST_DELAY);

    // Test 3: Player to Game Mapping
    log("\n📋 Teste 3: Mapeamento Jogador → Jogo", colors.cyan);
    const testPlayerId = "test_player_1";

    const mapped = await mapPlayerToGame(testPlayerId, testGameId);
    assert(mapped, "Jogador deve ser mapeado ao jogo");

    const playerGameId = await getPlayerGame(testPlayerId);
    assert(
      playerGameId === testGameId,
      "Jogo recuperado deve corresponder ao ID mapeado",
    );

    await sleep(TEST_DELAY);

    // Test 4: Game Heartbeat
    log("\n📋 Teste 4: Sistema de Heartbeat", colors.cyan);
    const heartbeatUpdated = await updateGameHeartbeat(
      testGameId,
      "test-server",
    );
    assert(heartbeatUpdated, "Heartbeat deve ser atualizado com sucesso");

    const heartbeat = await getGameHeartbeat(testGameId);
    assert(heartbeat !== null, "Heartbeat deve ser recuperado");
    assert(
      heartbeat.serverId === "test-server",
      "Server ID no heartbeat deve estar correto",
    );
    assert(heartbeat.timestamp > 0, "Timestamp deve ser válido");

    await sleep(TEST_DELAY);

    // Test 5: Active Games List
    log("\n📋 Teste 5: Lista de Jogos Ativos", colors.cyan);
    const activeGames = await getAllActiveGames();
    assert(Array.isArray(activeGames), "Lista de jogos ativos deve ser array");
    assert(
      activeGames.includes(testGameId),
      "Jogo de teste deve estar na lista de ativos",
    );

    await sleep(TEST_DELAY);

    // Test 6: Orphaned Games Detection (should be none initially)
    log("\n📋 Teste 6: Detecção de Jogos Órfãos", colors.cyan);
    const orphanedBefore = await findOrphanedGames();
    info(`Jogos órfãos encontrados: ${orphanedBefore.length}`);
    // Não assertamos que deve ser 0, pois pode haver jogos órfãos de testes anteriores

    await sleep(TEST_DELAY);

    // Test 7: Simulate Orphaned Game (remove heartbeat)
    log("\n📋 Teste 7: Simulação de Jogo Órfão", colors.cyan);
    // Criar outro jogo sem heartbeat
    const orphanGameId = 9998;
    const orphanGameState = {
      id: orphanGameId,
      player1: { id: "orphan_player", name: "Orphan Player" },
      gameOver: false,
    };

    await saveGameState(orphanGameId, orphanGameState, 300);
    // NÃO atualizar heartbeat intencionalmente

    await sleep(2000); // Aguardar para garantir que não há heartbeat

    const orphanedAfter = await findOrphanedGames();
    assert(
      orphanedAfter.includes(orphanGameId),
      "Jogo sem heartbeat deve ser detectado como órfão",
    );

    await sleep(TEST_DELAY);

    // Test 8: Delete Game State
    log("\n📋 Teste 8: Remoção de Estado do Jogo", colors.cyan);
    const deleted = await deleteGameState(testGameId);
    assert(deleted, "Estado do jogo deve ser removido com sucesso");

    const retrievedAfterDelete = await getGameState(testGameId);
    assert(
      retrievedAfterDelete === null,
      "Estado do jogo deve ser null após remoção",
    );

    // Limpar jogo órfão também
    await deleteGameState(orphanGameId);

    await sleep(TEST_DELAY);

    // Test 9: WebSocket Connection with Recovery
    log(
      "\n📋 Teste 9: Conexão WebSocket com Sistema de Recuperação",
      colors.cyan,
    );

    const client = ioClient(SERVER_URL, {
      auth: { token: null },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 3,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout ao conectar ao servidor"));
      }, 5000);

      client.on("connect", () => {
        clearTimeout(timeout);
        success("Cliente conectado ao servidor WebSocket");
        resolve();
      });

      client.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert(client.connected, "Cliente deve estar conectado ao servidor");

    // Emitir evento de join
    client.emit("join", {
      id: "test_recovery_user",
      name: "Test Recovery User",
      token: null,
    });

    await sleep(TEST_DELAY);

    // Test 10: Reconnection Event Handler
    log("\n📋 Teste 10: Handler de Reconexão", colors.cyan);

    client.on("reconnection_complete", (data) => {
      info(`Evento de reconexão recebido: ${JSON.stringify(data)}`);
    });

    // Simular desconexão e reconexão
    info("Simulando desconexão...");
    client.disconnect();

    await sleep(1000);

    info("Reconectando...");
    client.connect();

    await sleep(2000);

    assert(client.connected, "Cliente deve reconectar com sucesso");

    // Fechar conexão
    client.close();

    await sleep(TEST_DELAY);

    // Summary
    log("\n" + "=".repeat(70), colors.blue);
    log("📊 RESUMO DOS TESTES", colors.blue);
    log("=".repeat(70), colors.blue);
    log(`Total de testes: ${testsPassed + testsFailed}`);
    success(`Testes passados: ${testsPassed}`);
    if (testsFailed > 0) {
      error(`Testes falhados: ${testsFailed}`);
    }

    const successRate = (
      (testsPassed / (testsPassed + testsFailed)) *
      100
    ).toFixed(1);
    log(`Taxa de sucesso: ${successRate}%\n`);

    if (testsFailed === 0) {
      success("🎉 TODOS OS TESTES PASSARAM! ✅\n");
      process.exit(0);
    } else {
      error("❌ ALGUNS TESTES FALHARAM\n");
      process.exit(1);
    }
  } catch (err) {
    error(`\n❌ ERRO CRÍTICO NOS TESTES: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

// Executar testes
runTests();
