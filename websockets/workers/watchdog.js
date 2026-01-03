import {
  getAllActiveGames,
  getGameState,
  getGameHeartbeat,
  getGameMetadata,
  deleteGameState,
  unmapPlayerFromGame,
} from "../redis/gameStateManager.js";
import * as LaravelAPI from "../services/laravel.js";

// Configurações do Watchdog
const WATCHDOG_INTERVAL = 30000; // Verificar a cada 30 segundos
const GAME_TIMEOUT_MS = 120000; // 2 minutos sem heartbeat = timeout
const MAX_GAME_DURATION_MS = 3600000; // 1 hora máxima por jogo

// Estatísticas do Watchdog
let stats = {
  checksPerformed: 0,
  gamesTimedOut: 0,
  refundsProcessed: 0,
  errors: 0,
  lastCheckTimestamp: null,
};

/**
 * Processa o timeout de um jogo específico
 * @param {number} gameId - ID do jogo
 * @param {string} reason - Razão do timeout
 */
const handleGameTimeout = async (gameId, reason) => {
  try {
    console.log(`\n[Watchdog] Processando timeout do jogo ${gameId}`);
    console.log(`   Razão: ${reason}`);

    // Recuperar estado e metadata do jogo
    const gameState = await getGameState(gameId);
    const metadata = await getGameMetadata(gameId);

    if (!gameState) {
      console.warn(
        `[Watchdog] Estado do jogo ${gameId} não encontrado no Redis`,
      );
      return;
    }

    // Extrair informações dos jogadores
    const player1 = gameState.player1;
    const player2 = gameState.player2;

    if (!player1) {
      console.warn(`[Watchdog] Jogo ${gameId} sem jogadores válidos`);
      await deleteGameState(gameId);
      return;
    }

    console.log(`   Player 1: ${player1.name} (ID: ${player1.id})`);
    console.log(
      `   Player 2: ${player2 ? player2.name : "BOT"} (ID: ${player2?.id || 0})`,
    );

    // Verificar se é modo practice (não reembolsar)
    if (metadata?.isPractice || gameState.isPractice) {
      console.log(`   ℹ️  Modo Practice - Sem reembolso necessário`);
      await cleanupGame(gameId, player1.id, player2?.id);
      stats.gamesTimedOut++;
      return;
    }

    // Determinar o valor do stake (aposta)
    const isMatch = metadata?.isMatch || gameState.isMatch || false;
    const stake = metadata?.stake || (isMatch ? 10 : 2);

    console.log(`Stake: ${stake} coins (${isMatch ? "Match" : "Game"})`);

    // Processar reembolso para Player 1
    if (player1.token && player1.id !== 0) {
      const refunded1 = await processRefund(
        player1.id,
        player1.token,
        player1.name,
        stake,
        gameId,
        reason,
      );
      if (refunded1) stats.refundsProcessed++;
    }

    // Processar reembolso para Player 2 (se não for BOT)
    if (player2 && player2.id !== 0 && player2.token) {
      const refunded2 = await processRefund(
        player2.id,
        player2.token,
        player2.name,
        stake,
        gameId,
        reason,
      );
      if (refunded2) stats.refundsProcessed++;
    }

    // Cancelar match/game na API Laravel se existir
    if (metadata?.dbMatchId) {
      await cancelMatchInDB(metadata.dbMatchId, player1.token, reason);
    } else if (metadata?.dbGameId) {
      await cancelGameInDB(metadata.dbGameId, player1.token, reason);
    }

    // Limpar estado do jogo
    await cleanupGame(gameId, player1.id, player2?.id);

    stats.gamesTimedOut++;
    console.log(`[Watchdog] Jogo ${gameId} processado com sucesso`);
  } catch (error) {
    console.error(
      `[Watchdog] Erro ao processar timeout do jogo ${gameId}:`,
      error.message,
    );
    stats.errors++;
  }
};

/**
 * Processa o reembolso para um jogador
 * @param {string|number} playerId - ID do jogador
 * @param {string} token - Token de autenticação
 * @param {string} playerName - Nome do jogador
 * @param {number} amount - Valor a reembolsar
 * @param {number} gameId - ID do jogo
 * @param {string} reason - Razão do reembolso
 * @returns {boolean} Sucesso do reembolso
 */
const processRefund = async (
  playerId,
  token,
  playerName,
  amount,
  gameId,
  reason,
) => {
  try {
    console.log(
      `Reembolsando ${amount} coins para ${playerName} (ID: ${playerId})`,
    );

    // Chamar API Laravel para adicionar coins de volta
    const refundResult = await LaravelAPI.refundCoins(playerId, amount, token, {
      game_id: gameId,
      reason: reason,
      timestamp: new Date().toISOString(),
    });

    if (refundResult) {
      console.log(`Reembolso concluído para ${playerName}`);

      // Notificar cliente via WebSocket (se disponível)
      if (global.io) {
        global.io.emit("game_cancelled", {
          gameId,
          reason,
          refundAmount: amount,
          userId: playerId,
          message: `Jogo cancelado por ${reason}. ${amount} coins foram reembolsadas.`,
        });

        // Atualizar balance do jogador
        const newBalance = await LaravelAPI.getUserBalance(token);
        if (newBalance !== null) {
          global.io.emit("balance_update", {
            userId: playerId,
            balance: newBalance,
          });
        }
      }

      return true;
    } else {
      console.error(`Falha ao reembolsar ${playerName}`);
      return false;
    }
  } catch (error) {
    console.error(
      `Erro ao processar reembolso para ${playerName}:`,
      error.message,
    );
    return false;
  }
};

/**
 * Cancela uma match no banco de dados
 * @param {number} matchId - ID da match
 * @param {string} token - Token de autenticação
 * @param {string} reason - Razão do cancelamento
 */
const cancelMatchInDB = async (matchId, token, reason) => {
  try {
    console.log(`Cancelando Match ${matchId} na BD`);
    await LaravelAPI.cancelMatch(matchId, token, reason);
    console.log(`Match ${matchId} cancelada`);
  } catch (error) {
    console.error(`Erro ao cancelar match ${matchId}:`, error.message);
  }
};

/**
 * Cancela um game no banco de dados
 * @param {number} gameId - ID do game
 * @param {string} token - Token de autenticação
 * @param {string} reason - Razão do cancelamento
 */
const cancelGameInDB = async (gameId, token, reason) => {
  try {
    console.log(`Cancelando Game ${gameId} na BD`);
    await LaravelAPI.cancelGame(gameId, token, reason);
    console.log(`Game ${gameId} cancelado`);
  } catch (error) {
    console.error(`Erro ao cancelar game ${gameId}:`, error.message);
  }
};

/**
 * Limpa completamente um jogo do sistema
 * @param {number} gameId - ID do jogo
 * @param {string} player1Id - ID do jogador 1
 * @param {string} player2Id - ID do jogador 2
 */
const cleanupGame = async (gameId, player1Id, player2Id) => {
  try {
    // Remover mapeamento dos jogadores
    if (player1Id) await unmapPlayerFromGame(player1Id);
    if (player2Id) await unmapPlayerFromGame(player2Id);

    // Remover estado do jogo do Redis
    await deleteGameState(gameId);

    console.log(`Limpeza do jogo ${gameId} concluída`);
  } catch (error) {
    console.error(`Erro na limpeza do jogo ${gameId}:`, error.message);
  }
};

/**
 * Verifica se um jogo está em timeout
 * @param {number} gameId - ID do jogo
 * @returns {object|null} Informações do timeout ou null se OK
 */
const checkGameTimeout = async (gameId) => {
  try {
    const gameState = await getGameState(gameId);
    const heartbeat = await getGameHeartbeat(gameId);
    const metadata = await getGameMetadata(gameId);

    if (!gameState) {
      return { timeout: true, reason: "Estado do jogo não encontrado" };
    }

    // Verificar se o jogo já terminou
    if (gameState.gameOver || gameState.status === "finished") {
      console.log(`Jogo ${gameId} já terminou normalmente`);
      await deleteGameState(gameId);
      return null;
    }

    const now = Date.now();

    // Verificar heartbeat (servidor está vivo?)
    if (!heartbeat) {
      return {
        timeout: true,
        reason: "Servidor não responde (sem heartbeat)",
      };
    }

    const heartbeatAge = now - heartbeat.timestamp;
    if (heartbeatAge > GAME_TIMEOUT_MS) {
      return {
        timeout: true,
        reason: `Servidor inativo há ${Math.floor(heartbeatAge / 1000)}s`,
      };
    }

    // Verificar duração máxima do jogo
    if (metadata?.startTime) {
      const gameDuration = now - metadata.startTime;
      if (gameDuration > MAX_GAME_DURATION_MS) {
        return {
          timeout: true,
          reason: `Jogo excedeu duração máxima (${Math.floor(gameDuration / 60000)} min)`,
        };
      }
    }

    // Jogo está OK
    return null;
  } catch (error) {
    console.error(
      `[Watchdog] Erro ao verificar jogo ${gameId}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Ciclo principal do Watchdog
 */
const runWatchdogCycle = async () => {
  try {
    console.log(
      `\n[Watchdog] Iniciando verificação (Ciclo #${stats.checksPerformed + 1})`,
    );

    const activeGames = await getAllActiveGames();
    console.log(`   Jogos ativos: ${activeGames.length}`);

    if (activeGames.length === 0) {
      console.log(`Nenhum jogo ativo para verificar`);
      stats.lastCheckTimestamp = Date.now();
      stats.checksPerformed++;
      return;
    }

    let timedOutCount = 0;

    for (const gameId of activeGames) {
      const timeoutInfo = await checkGameTimeout(gameId);

      if (timeoutInfo && timeoutInfo.timeout) {
        console.log(`Jogo ${gameId} em TIMEOUT!`);
        await handleGameTimeout(gameId, timeoutInfo.reason);
        timedOutCount++;
      }
    }

    console.log(`   Jogos com timeout: ${timedOutCount}`);
    console.log(`   Verificação concluída\n`);

    stats.lastCheckTimestamp = Date.now();
    stats.checksPerformed++;
  } catch (error) {
    console.error(`[Watchdog] Erro no ciclo de verificação:`, error.message);
    stats.errors++;
  }
};

/**
 * Inicia o Watchdog Worker
 */
export const startWatchdog = () => {
  console.log(`\n[Watchdog] Iniciando Worker...`);
  console.log(`   Intervalo: ${WATCHDOG_INTERVAL / 1000}s`);
  console.log(`   Timeout: ${GAME_TIMEOUT_MS / 1000}s sem heartbeat`);
  console.log(`   Duração máxima: ${MAX_GAME_DURATION_MS / 60000} minutos\n`);

  // Executar imediatamente a primeira verificação
  runWatchdogCycle();

  // Agendar verificações periódicas
  const intervalId = setInterval(runWatchdogCycle, WATCHDOG_INTERVAL);

  // Graceful shutdown
  const shutdown = () => {
    console.log(`\n[Watchdog] Encerrando...`);
    clearInterval(intervalId);
    printStats();
    console.log(`[Watchdog] Encerrado\n`);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return intervalId;
};

/**
 * Para o Watchdog Worker
 */
export const stopWatchdog = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log(`[Watchdog] Worker parado`);
  }
};

/**
 * Obtém estatísticas do Watchdog
 */
export const getWatchdogStats = () => {
  return { ...stats };
};

/**
 * Reseta estatísticas do Watchdog
 */
export const resetWatchdogStats = () => {
  stats = {
    checksPerformed: 0,
    gamesTimedOut: 0,
    refundsProcessed: 0,
    errors: 0,
    lastCheckTimestamp: null,
  };
  console.log(`[Watchdog] Estatísticas resetadas`);
};

/**
 * Imprime estatísticas do Watchdog
 */
const printStats = () => {
  console.log(`\n[Watchdog] Estatísticas:`);
  console.log(`   Verificações realizadas: ${stats.checksPerformed}`);
  console.log(`   Jogos com timeout: ${stats.gamesTimedOut}`);
  console.log(`   Reembolsos processados: ${stats.refundsProcessed}`);
  console.log(`   Erros: ${stats.errors}`);
  console.log(
    `   Última verificação: ${stats.lastCheckTimestamp ? new Date(stats.lastCheckTimestamp).toLocaleString() : "N/A"}\n`,
  );
};

// Exportar função para verificação manual
export const manualCheck = async () => {
  console.log(`\n[Watchdog] Verificação manual solicitada`);
  await runWatchdogCycle();
  printStats();
};
