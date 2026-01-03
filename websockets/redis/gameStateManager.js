import { redisClient } from "./client.js";

// Prefixos para organização no Redis
const PREFIXES = {
  GAME: "game:",
  PLAYER_GAME: "player_game:",
  ACTIVE_GAMES: "active_games",
  GAME_HEARTBEAT: "game_heartbeat:",
  GAME_METADATA: "game_meta:",
};

// TTL padrão para jogos (2 horas)
const DEFAULT_GAME_TTL = 7200;

// TTL para heartbeat (3 minutos - se não receber sinal, jogo é considerado órfão)
const HEARTBEAT_TTL = 180;

/**
 * Salva o estado completo de um jogo no Redis
 * @param {number} gameId - ID do jogo
 * @param {object} gameState - Estado completo do jogo
 * @param {number} ttl - Tempo de vida em segundos
 */
export const saveGameState = async (gameId, gameState, ttl = DEFAULT_GAME_TTL) => {
  try {
    const key = `${PREFIXES.GAME}${gameId}`;
    const serialized = JSON.stringify(gameState);

    await redisClient.setex(key, ttl, serialized);

    // Adicionar ao conjunto de jogos ativos
    await redisClient.sadd(PREFIXES.ACTIVE_GAMES, gameId.toString());

    console.log(`[Redis] Estado do jogo ${gameId} salvo (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao salvar jogo ${gameId}:`, error.message);
    return false;
  }
};

/**
 * Recupera o estado de um jogo do Redis
 * @param {number} gameId - ID do jogo
 * @returns {object|null} Estado do jogo ou null se não encontrado
 */
export const getGameState = async (gameId) => {
  try {
    const key = `${PREFIXES.GAME}${gameId}`;
    const data = await redisClient.get(key);

    if (!data) {
      console.log(`[Redis] Jogo ${gameId} não encontrado`);
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`[Redis] Erro ao recuperar jogo ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Remove um jogo do Redis
 * @param {number} gameId - ID do jogo
 */
export const deleteGameState = async (gameId) => {
  try {
    const key = `${PREFIXES.GAME}${gameId}`;

    // Remover estado do jogo
    await redisClient.del(key);

    // Remover do conjunto de jogos ativos
    await redisClient.srem(PREFIXES.ACTIVE_GAMES, gameId.toString());

    // Remover heartbeat
    await redisClient.del(`${PREFIXES.GAME_HEARTBEAT}${gameId}`);

    // Remover metadata
    await redisClient.del(`${PREFIXES.GAME_METADATA}${gameId}`);

    console.log(`[Redis] Jogo ${gameId} removido completamente`);
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao remover jogo ${gameId}:`, error.message);
    return false;
  }
};

/**
 * Mapeia um jogador para seu jogo ativo
 * @param {string} playerId - ID do jogador
 * @param {number} gameId - ID do jogo
 */
export const mapPlayerToGame = async (playerId, gameId) => {
  try {
    const key = `${PREFIXES.PLAYER_GAME}${playerId}`;
    await redisClient.setex(key, DEFAULT_GAME_TTL, gameId.toString());
    console.log(`[Redis] Jogador ${playerId} mapeado para jogo ${gameId}`);
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao mapear jogador ${playerId}:`, error.message);
    return false;
  }
};

/**
 * Obtém o jogo ativo de um jogador
 * @param {string} playerId - ID do jogador
 * @returns {number|null} ID do jogo ou null
 */
export const getPlayerGame = async (playerId) => {
  try {
    const key = `${PREFIXES.PLAYER_GAME}${playerId}`;
    const gameId = await redisClient.get(key);
    return gameId ? parseInt(gameId) : null;
  } catch (error) {
    console.error(`[Redis] Erro ao buscar jogo do jogador ${playerId}:`, error.message);
    return null;
  }
};

/**
 * Remove o mapeamento de jogador para jogo
 * @param {string} playerId - ID do jogador
 */
export const unmapPlayerFromGame = async (playerId) => {
  try {
    const key = `${PREFIXES.PLAYER_GAME}${playerId}`;
    await redisClient.del(key);
    console.log(`[Redis] Mapeamento do jogador ${playerId} removido`);
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao remover mapeamento do jogador ${playerId}:`, error.message);
    return false;
  }
};

/**
 * Obtém todos os jogos ativos
 * @returns {Array<number>} Array com IDs dos jogos ativos
 */
export const getAllActiveGames = async () => {
  try {
    const gameIds = await redisClient.smembers(PREFIXES.ACTIVE_GAMES);
    return gameIds.map(id => parseInt(id));
  } catch (error) {
    console.error("[Redis] Erro ao buscar jogos ativos:", error.message);
    return [];
  }
};

/**
 * Atualiza o heartbeat de um jogo (indica que o servidor está vivo)
 * @param {number} gameId - ID do jogo
 * @param {string} serverId - ID do servidor que gerencia o jogo
 */
export const updateGameHeartbeat = async (gameId, serverId = process.env.SERVER_ID || "default") => {
  try {
    const key = `${PREFIXES.GAME_HEARTBEAT}${gameId}`;
    const heartbeatData = {
      serverId,
      timestamp: Date.now(),
      pid: process.pid,
    };

    await redisClient.setex(key, HEARTBEAT_TTL, JSON.stringify(heartbeatData));
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao atualizar heartbeat do jogo ${gameId}:`, error.message);
    return false;
  }
};

/**
 * Verifica se um jogo tem heartbeat ativo (servidor está respondendo)
 * @param {number} gameId - ID do jogo
 * @returns {object|null} Dados do heartbeat ou null se expirado
 */
export const getGameHeartbeat = async (gameId) => {
  try {
    const key = `${PREFIXES.GAME_HEARTBEAT}${gameId}`;
    const data = await redisClient.get(key);

    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error(`[Redis] Erro ao verificar heartbeat do jogo ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Salva metadata adicional do jogo (informações que não mudam frequentemente)
 * @param {number} gameId - ID do jogo
 * @param {object} metadata - Metadados do jogo
 */
export const saveGameMetadata = async (gameId, metadata) => {
  try {
    const key = `${PREFIXES.GAME_METADATA}${gameId}`;
    await redisClient.setex(key, DEFAULT_GAME_TTL, JSON.stringify(metadata));
    console.log(`[Redis] Metadata do jogo ${gameId} salva`);
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao salvar metadata do jogo ${gameId}:`, error.message);
    return false;
  }
};

/**
 * Recupera metadata do jogo
 * @param {number} gameId - ID do jogo
 * @returns {object|null} Metadata ou null
 */
export const getGameMetadata = async (gameId) => {
  try {
    const key = `${PREFIXES.GAME_METADATA}${gameId}`;
    const data = await redisClient.get(key);

    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error(`[Redis] Erro ao recuperar metadata do jogo ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Busca jogos órfãos (sem heartbeat há muito tempo)
 * @returns {Array<number>} Array com IDs dos jogos órfãos
 */
export const findOrphanedGames = async () => {
  try {
    const activeGames = await getAllActiveGames();
    const orphanedGames = [];

    for (const gameId of activeGames) {
      const heartbeat = await getGameHeartbeat(gameId);

      // Se não tem heartbeat, é órfão
      if (!heartbeat) {
        orphanedGames.push(gameId);
      }
    }

    return orphanedGames;
  } catch (error) {
    console.error("[Redis] Erro ao buscar jogos órfãos:", error.message);
    return [];
  }
};

/**
 * Incrementa um contador atômico (útil para IDs de jogos em múltiplos servidores)
 * @param {string} counterName - Nome do contador
 * @returns {number} Novo valor do contador
 */
export const incrementCounter = async (counterName = "game_id_counter") => {
  try {
    const value = await redisClient.incr(counterName);
    return value;
  } catch (error) {
    console.error(`[Redis] Erro ao incrementar contador ${counterName}:`, error.message);
    return null;
  }
};

/**
 * Inicializa um contador se não existir
 * @param {string} counterName - Nome do contador
 * @param {number} initialValue - Valor inicial
 */
export const initializeCounter = async (counterName = "game_id_counter", initialValue = 0) => {
  try {
    const exists = await redisClient.exists(counterName);
    if (!exists) {
      await redisClient.set(counterName, initialValue);
      console.log(`[Redis] Contador ${counterName} inicializado com valor ${initialValue}`);
    }
    return true;
  } catch (error) {
    console.error(`[Redis] Erro ao inicializar contador ${counterName}:`, error.message);
    return false;
  }
};

/**
 * Obtém estatísticas do Redis
 * @returns {object} Estatísticas
 */
export const getRedisStats = async () => {
  try {
    const activeGamesCount = await redisClient.scard(PREFIXES.ACTIVE_GAMES);
    const keys = await redisClient.keys("*");

    return {
      activeGames: activeGamesCount,
      totalKeys: keys.length,
      memory: await redisClient.info("memory"),
    };
  } catch (error) {
    console.error("[Redis] Erro ao obter estatísticas:", error.message);
    return null;
  }
};
