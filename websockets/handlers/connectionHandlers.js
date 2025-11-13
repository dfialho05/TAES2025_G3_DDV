// Connection manager class that handles player sessions, disconnections, and reconnections
class ConnectionManager {
  constructor() {
    this.activeSessions = new Map(); // Map of socketId -> session info
    this.playerSockets = new Map(); // Map of playerName -> socketId
    this.disconnectedPlayers = new Map(); // Map of disconnected players awaiting reconnect
    this.reconnectTimeouts = new Map(); // Map of playerName -> timeout ID
  }

  // Registers a new player session
  registerPlayer = (socketId, playerName, playerInfo = {}) => {
    const sessionInfo = {
      socketId,
      playerName,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ...playerInfo,
    };

    this.activeSessions.set(socketId, sessionInfo);
    this.playerSockets.set(playerName, socketId);

    this.disconnectedPlayers.delete(playerName);
    this.clearReconnectTimeout(playerName);

    console.log(`Jogador registrado: ${playerName} (${socketId})`);
    return sessionInfo;
  };

  // Handles player disconnection and sets up reconnection timeout
  handleDisconnection = (socketId, gameManager) => {
    const session = this.activeSessions.get(socketId);
    if (!session) return null;

    const { playerName } = session;

    this.disconnectedPlayers.set(playerName, {
      ...session,
      disconnectedAt: new Date().toISOString(),
      gameId: gameManager.playerGames.get(playerName),
    });

    this.activeSessions.delete(socketId);
    this.playerSockets.delete(playerName);

    this.setReconnectTimeout(playerName, gameManager, 120000);

    console.log(`Jogador desconectado: ${playerName} (${socketId})`);
    return { playerName, gameId: gameManager.playerGames.get(playerName) };
  };

  // Handles player reconnection to an existing session
  handleReconnection = (socketId, playerName, gameManager) => {
    const disconnectedInfo = this.disconnectedPlayers.get(playerName);
    if (!disconnectedInfo) {
      return {
        success: false,
        error: "Nenhuma sessão desconectada encontrada",
      };
    }

    this.registerPlayer(socketId, playerName, {
      reconnectedAt: new Date().toISOString(),
      originalConnection: disconnectedInfo.connectedAt,
    });

    const gameId = disconnectedInfo.gameId;
    let gameState = null;

    if (gameId) {
      const game = gameManager.activeGames.get(gameId);
      if (game) {
        gameState = game.getState();
      }
    }

    console.log(`Jogador reconectado: ${playerName} (${socketId})`);
    return {
      success: true,
      gameId,
      gameState,
      disconnectedAt: disconnectedInfo.disconnectedAt,
      reconnectedAt: new Date().toISOString(),
    };
  };

  // Sets a timeout for player reconnection
  setReconnectTimeout = (playerName, gameManager, timeout) => {
    this.clearReconnectTimeout(playerName);

    const timeoutId = setTimeout(() => {
      console.log(`Timeout de reconexão para ${playerName}`);
      this.handleReconnectTimeout(playerName, gameManager);
    }, timeout);

    this.reconnectTimeouts.set(playerName, timeoutId);
  };

  // Clears the reconnection timeout for a player
  clearReconnectTimeout = (playerName) => {
    const timeoutId = this.reconnectTimeouts.get(playerName);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reconnectTimeouts.delete(playerName);
    }
  };

  // Handles when a player's reconnection timeout expires
  handleReconnectTimeout = (playerName, gameManager) => {
    const disconnectedInfo = this.disconnectedPlayers.get(playerName);
    if (!disconnectedInfo) return;

    const gameId = disconnectedInfo.gameId;
    if (gameId) {
      const game = gameManager.activeGames.get(gameId);
      if (game) {
        console.log(`Jogo ${gameId} encerrado por abandono de ${playerName}`);
      }
    }

    this.disconnectedPlayers.delete(playerName);
    this.clearReconnectTimeout(playerName);
  };

  // Updates the last activity timestamp for a session
  updateActivity = (socketId) => {
    const session = this.activeSessions.get(socketId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
  };

  // Gets the active session for a player
  getPlayerSession = (playerName) => {
    const socketId = this.playerSockets.get(playerName);
    return socketId ? this.activeSessions.get(socketId) : null;
  };

  // Returns an array of all active player names
  getActivePlayers = () => {
    return Array.from(this.playerSockets.keys());
  };

  // Checks if a player is currently connected
  isPlayerConnected = (playerName) => {
    return this.playerSockets.has(playerName);
  };

  // Gets comprehensive statistics for a specific player
  getPlayerStats = (playerName) => {
    const session = this.getPlayerSession(playerName);
    const disconnectedInfo = this.disconnectedPlayers.get(playerName);

    return {
      playerName,
      isConnected: !!session,
      session,
      disconnectedInfo,
      hasReconnectTimeout: this.reconnectTimeouts.has(playerName),
    };
  };
}

// Validates player name format and requirements
export const validatePlayerName = (playerName) => {
  if (!playerName || typeof playerName !== "string") {
    return { valid: false, error: "Nome do jogador é obrigatório" };
  }

  if (playerName.trim().length < 2) {
    return { valid: false, error: "Nome deve ter pelo menos 2 caracteres" };
  }

  if (playerName.trim().length > 20) {
    return { valid: false, error: "Nome deve ter no máximo 20 caracteres" };
  }

  if (!/^[a-zA-Z0-9_\-\s]+$/.test(playerName.trim())) {
    return { valid: false, error: "Nome contém caracteres inválidos" };
  }

  return { valid: true, playerName: playerName.trim() };
};

// Handles player authentication and session creation
export const handlePlayerAuth = (
  socket,
  playerName,
  connectionManager,
  additionalInfo = {},
) => {
  try {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const validatedName = validation.playerName;

    if (connectionManager.isPlayerConnected(validatedName)) {
      return { success: false, error: "Jogador já está conectado" };
    }

    const sessionInfo = connectionManager.registerPlayer(
      socket.id,
      validatedName,
      additionalInfo,
    );

    return { success: true, sessionInfo, playerName: validatedName };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles player reconnection to existing session
export const handlePlayerReconnect = (
  socket,
  playerName,
  connectionManager,
  gameManager,
) => {
  try {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const validatedName = validation.playerName;

    if (connectionManager.isPlayerConnected(validatedName)) {
      return { success: false, error: "Jogador já está conectado" };
    }

    const result = connectionManager.handleReconnection(
      socket.id,
      validatedName,
      gameManager,
    );

    if (result.success) {
      console.log(`Reconexão bem-sucedida: ${validatedName}`);
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles socket disconnection and notifies other players
export const handleSocketDisconnect = (
  socket,
  connectionManager,
  gameManager,
  io,
) => {
  try {
    const disconnectionInfo = connectionManager.handleDisconnection(
      socket.id,
      gameManager,
    );

    if (disconnectionInfo && disconnectionInfo.gameId) {
      socket.to(disconnectionInfo.gameId).emit("playerDisconnected", {
        player: disconnectionInfo.playerName,
        message: `${disconnectionInfo.playerName} se desconectou`,
        canReconnect: true,
        timeout: 120,
      });
    }

    return { success: true, disconnectionInfo };
  } catch (error) {
    console.error("Erro ao lidar com desconexão:", error);
    return { success: false, error: error.message };
  }
};

// Returns comprehensive connection statistics
export const getConnectionStats = (connectionManager) => {
  const activePlayers = connectionManager.getActivePlayers();
  const disconnectedPlayers = Array.from(
    connectionManager.disconnectedPlayers.keys(),
  );
  const playersWithTimeouts = Array.from(
    connectionManager.reconnectTimeouts.keys(),
  );

  return {
    activeConnections: activePlayers.length,
    activePlayers,
    disconnectedPlayers: disconnectedPlayers.length,
    disconnectedPlayersList: disconnectedPlayers,
    playersAwaitingReconnect: playersWithTimeouts.length,
    playersAwaitingReconnectList: playersWithTimeouts,
    totalSessions: connectionManager.activeSessions.size,
  };
};

// Cleans up expired disconnected sessions
export const cleanupExpiredSessions = (connectionManager, maxAge = 3600000) => {
  const now = new Date();
  const expiredSessions = [];

  for (const [playerName, info] of connectionManager.disconnectedPlayers) {
    const disconnectedAt = new Date(info.disconnectedAt);
    if (now - disconnectedAt > maxAge) {
      expiredSessions.push(playerName);
    }
  }

  expiredSessions.forEach((playerName) => {
    connectionManager.disconnectedPlayers.delete(playerName);
    connectionManager.clearReconnectTimeout(playerName);
    console.log(`Sessão expirada limpa: ${playerName}`);
  });

  return { cleanedSessions: expiredSessions.length };
};

export const connectionManager = new ConnectionManager();

export { ConnectionManager };
