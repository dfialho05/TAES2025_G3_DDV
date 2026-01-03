import {
  getGameState,
  getPlayerGame,
  saveGameState,
  updateGameHeartbeat,
  mapPlayerToGame,
} from "./gameStateManager.js";
import { addUser } from "../state/connections.js";

/**
 * Tenta recuperar o estado de um jogo para um jogador que reconectou
 * @param {string} playerId - ID do jogador
 * @param {object} socket - Socket do jogador
 * @param {object} io - Instância do Socket.IO
 * @returns {object|null} Estado do jogo recuperado ou null
 */
export const attemptGameRecovery = async (playerId, socket, io) => {
  try {
    console.log(
      `\n[Recovery] Tentando recuperar jogo para jogador ${playerId}`,
    );

    const gameId = await getPlayerGame(playerId);

    if (!gameId) {
      console.log(
        `[Recovery] Jogador ${playerId} não tem jogo ativo para recuperar`,
      );
      return null;
    }

    console.log(`[Recovery] Jogo ativo encontrado: ${gameId}`);

    const gameState = await getGameState(gameId);

    if (!gameState) {
      console.warn(
        `[Recovery] Estado do jogo ${gameId} não encontrado no Redis`,
      );
      return null;
    }

    if (gameState.gameOver || gameState.status === "finished") {
      console.log(
        `[Recovery] Jogo ${gameId} já terminou - Não é necessário recuperar`,
      );
      return null;
    }

    const isPlayer1 = String(gameState.player1?.id) === String(playerId);
    const isPlayer2 = String(gameState.player2?.id) === String(playerId);

    if (!isPlayer1 && !isPlayer2) {
      console.warn(
        `[Recovery] Jogador ${playerId} não pertence ao jogo ${gameId}`,
      );
      return null;
    }

    const playerRole = isPlayer1 ? "player1" : "player2";
    console.log(`[Recovery] Jogador identificado como: ${playerRole}`);

    const room = `game-${gameId}`;
    socket.join(room);
    console.log(`[Recovery] Jogador ${playerId} readicionado à sala ${room}`);

    if (gameState.player1?.id === playerId) {
      gameState.player1.socketId = socket.id;
    } else if (gameState.player2?.id === playerId) {
      gameState.player2.socketId = socket.id;
    }

    await saveGameState(gameId, gameState);
    await updateGameHeartbeat(gameId);
    console.log(
      `[Recovery] Socket.id atualizado no Redis para jogador ${playerId}`,
    );

    socket.emit("game_recovered", {
      gameId: gameId,
      gameState: gameState,
      playerRole: playerRole,
      message: "Jogo recuperado com sucesso! Você pode continuar jogando.",
    });

    socket.to(room).emit("player_reconnected", {
      playerId: playerId,
      playerRole: playerRole,
      message: `${playerRole} reconectou-se ao jogo.`,
    });

    console.log(`[Recovery] Recuperação concluída para jogador ${playerId}`);

    return {
      gameId,
      gameState,
      playerRole,
      recovered: true,
    };
  } catch (error) {
    console.error(
      `[Recovery] Erro ao recuperar jogo para jogador ${playerId}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Recupera todos os jogos ativos após reinício do servidor
 * @param {object} io - Instância do Socket.IO
 * @param {Map} gamesMap - Map local de jogos em memória
 */
export const recoverAllGamesOnStartup = async (io, gamesMap) => {
  try {
    console.log(
      `\n[Recovery] Iniciando recuperação de jogos após reinício do servidor...`,
    );

    const { getAllActiveGames } = await import("./gameStateManager.js");
    const activeGameIds = await getAllActiveGames();

    if (activeGameIds.length === 0) {
      console.log(`Nenhum jogo ativo para recuperar`);
      return { recovered: 0, failed: 0 };
    }

    console.log(`Jogos ativos encontrados: ${activeGameIds.length}`);

    let recovered = 0;
    let failed = 0;

    for (const gameId of activeGameIds) {
      try {
        const gameState = await getGameState(gameId);

        if (!gameState) {
          console.warn(`Estado do jogo ${gameId} não encontrado`);
          failed++;
          continue;
        }

        // Verificar se o jogo já terminou
        if (gameState.gameOver || gameState.status === "finished") {
          console.log(`Jogo ${gameId} já terminou - Removendo`);
          const { deleteGameState } = await import("./gameStateManager.js");
          await deleteGameState(gameId);
          continue;
        }

        // Recriar instância do jogo em memória (se necessário)
        if (!gamesMap.has(gameId)) {
          // Aqui você pode recriar a instância BiscaGame se necessário
          // Por agora, apenas mantemos o estado no Redis
          console.log(`Jogo ${gameId} mantido no Redis (aguardando reconexão)`);
        }

        // Atualizar heartbeat para marcar que este servidor está gerenciando o jogo
        await updateGameHeartbeat(gameId);

        recovered++;
        console.log(`Jogo ${gameId} recuperado com sucesso`);
      } catch (error) {
        console.error(`Erro ao recuperar jogo ${gameId}:`, error.message);
        failed++;
      }
    }

    console.log(`\n[Recovery] Resumo da recuperação:`);
    console.log(`Recuperados: ${recovered}`);
    console.log(`Falhados: ${failed}`);
    console.log(`Total: ${activeGameIds.length}\n`);

    return { recovered, failed, total: activeGameIds.length };
  } catch (error) {
    console.error(
      `[Recovery] Erro ao recuperar jogos no startup:`,
      error.message,
    );
    return { recovered: 0, failed: 0, total: 0 };
  }
};

/**
 * Sincroniza o estado de um jogo da memória para o Redis
 * @param {number} gameId - ID do jogo
 * @param {object} gameInstance - Instância do jogo (BiscaGame)
 * @returns {boolean} Sucesso da sincronização
 */
export const syncGameToRedis = async (gameId, gameInstance) => {
  try {
    // Extrair estado serializável do jogo
    const gameState =
      typeof gameInstance.getState === "function"
        ? gameInstance.getState()
        : gameInstance;

    // Salvar no Redis
    await saveGameState(gameId, gameState);

    // Atualizar heartbeat
    await updateGameHeartbeat(gameId);

    return true;
  } catch (error) {
    console.error(
      `[Recovery] Erro ao sincronizar jogo ${gameId} para Redis:`,
      error.message,
    );
    return false;
  }
};

/**
 * Sincroniza periodicamente todos os jogos ativos para o Redis
 * @param {Map} gamesMap - Map de jogos ativos em memória
 * @param {number} interval - Intervalo em milissegundos (padrão: 10s)
 */
export const startPeriodicSync = (gamesMap, interval = 10000) => {
  console.log(
    `\n[Recovery] Iniciando sincronização periódica (${interval / 1000}s)...`,
  );

  const syncInterval = setInterval(async () => {
    try {
      if (gamesMap.size === 0) {
        return; // Nada para sincronizar
      }

      let synced = 0;
      let errors = 0;

      for (const [gameId, gameInstance] of gamesMap.entries()) {
        const success = await syncGameToRedis(gameId, gameInstance);
        if (success) {
          synced++;
        } else {
          errors++;
        }
      }

      if (synced > 0 || errors > 0) {
        console.log(`[Recovery] Sincronização: ${synced} OK, ${errors} erros`);
      }
    } catch (error) {
      console.error(
        `[Recovery] Erro na sincronização periódica:`,
        error.message,
      );
    }
  }, interval);

  // Graceful shutdown
  const shutdown = () => {
    console.log(`\n[Recovery] Parando sincronização periódica...`);
    clearInterval(syncInterval);
    console.log(`[Recovery] Sincronização parada\n`);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return syncInterval;
};

/**
 * Para a sincronização periódica
 * @param {NodeJS.Timeout} intervalId - ID do intervalo
 */
export const stopPeriodicSync = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log(`[Recovery] Sincronização periódica parada`);
  }
};

/**
 * Handler para reconexão automática de clientes
 * @param {object} socket - Socket do cliente
 * @param {object} io - Instância do Socket.IO
 */
export const handleClientReconnection = async (socket, io) => {
  try {
    const user = socket.data.user;

    if (!user || !user.id || user.id === "loading" || socket.data.isGuest) {
      console.log(
        `[Recovery] Socket ${socket.id} sem usuário válido para recuperar`,
      );
      return;
    }

    console.log(`\n[Recovery] Cliente reconectado: ${user.name} (${user.id})`);

    addUser(socket.id, user);

    const recovery = await attemptGameRecovery(user.id, socket, io);

    if (recovery && recovery.recovered) {
      console.log(
        `[Recovery] Jogo recuperado automaticamente para ${user.name}`,
      );

      socket.emit("reconnection_complete", {
        userId: user.id,
        hasActiveGame: true,
        gameId: recovery.gameId,
        message: "Você foi reconectado ao seu jogo ativo!",
      });
    } else {
      console.log(
        `[Recovery] Nenhum jogo ativo para recuperar para ${user.name}`,
      );

      socket.emit("reconnection_complete", {
        userId: user.id,
        hasActiveGame: false,
        gameId: null,
        message: "Reconectado com sucesso!",
      });
    }
  } catch (error) {
    console.error(`[Recovery] Erro ao processar reconexão:`, error.message);
    socket.emit("recovery_error", {
      message: "Erro ao processar reconexão. Por favor, recarregue a página.",
      shouldRedirect: true,
      redirectTo: "/games/lobby",
    });
  }
};

/**
 * Marca um jogador como desconectado temporariamente (dá tempo para reconectar)
 * @param {string} playerId - ID do jogador
 * @param {number} gameId - ID do jogo
 * @param {object} io - Instância do Socket.IO
 */
export const markPlayerDisconnected = async (playerId, gameId, io) => {
  try {
    console.log(`[Recovery] Jogador ${playerId} desconectou do jogo ${gameId}`);

    // Notificar outros jogadores
    const room = `game-${gameId}`;
    io.to(room).emit("player_disconnected", {
      playerId: playerId,
      gameId: gameId,
      message: "Um jogador desconectou. Aguardando reconexão...",
      waitTime: 60, // segundos
    });

    // O jogo permanece no Redis e o Watchdog cuidará se não reconectar
    console.log(
      `[Recovery] Jogo ${gameId} mantido no Redis (aguardando reconexão)`,
    );
  } catch (error) {
    console.error(
      `[Recovery] Erro ao marcar jogador desconectado:`,
      error.message,
    );
  }
};

/**
 * Verifica se um jogo pode ser recuperado
 * @param {number} gameId - ID do jogo
 * @returns {boolean} True se o jogo pode ser recuperado
 */
export const canRecoverGame = async (gameId) => {
  try {
    const gameState = await getGameState(gameId);

    if (!gameState) {
      return false;
    }

    // Não recuperar jogos que já terminaram
    if (gameState.gameOver || gameState.status === "finished") {
      return false;
    }

    // Não recuperar jogos de practice (não têm stakes)
    if (gameState.isPractice) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `[Recovery] Erro ao verificar se jogo ${gameId} pode ser recuperado:`,
      error.message,
    );
    return false;
  }
};

/**
 * Limpa jogos antigos que não podem mais ser recuperados
 * @returns {number} Número de jogos limpos
 */
export const cleanupStaleGames = async () => {
  try {
    console.log(`\n[Recovery] Limpando jogos antigos...`);

    const { getAllActiveGames, deleteGameState } =
      await import("./gameStateManager.js");
    const activeGames = await getAllActiveGames();

    let cleaned = 0;

    for (const gameId of activeGames) {
      const canRecover = await canRecoverGame(gameId);

      if (!canRecover) {
        await deleteGameState(gameId);
        cleaned++;
        console.log(`Jogo ${gameId} removido (não recuperável)`);
      }
    }

    console.log(`${cleaned} jogos limpos\n`);
    return cleaned;
  } catch (error) {
    console.error(`[Recovery] Erro ao limpar jogos antigos:`, error.message);
    return 0;
  }
};
