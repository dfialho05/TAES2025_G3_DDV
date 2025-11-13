import { Server } from "socket.io";
import { GameManager } from "./handlers/gameManager.js";
import { botPlay } from "./handlers/singleplayer.js";
import { selectPlayWinner, doAPlay } from "./core/gameRules.js";
import { Card } from "./core/CardClass.js";

// Import error protection system
import errorHandler, { safeEmit, safeEmitToRoom } from "./core/errorHandler.js";
import socketProtection from "./middleware/socketProtection.js";
import protectedHandlers, {
  protectedGameHandlers,
  protectedMultiplayerHandlers,
  protectedConnectionHandlers,
} from "./handlers/protectedHandlers.js";

// Import original handlers (kept as fallback)
import {
  validateGameStart,
  getGameStats,
  handleNewGameInMatch,
} from "./handlers/gameHandlers.js";

import {
  leaveMultiplayerRoom,
  joinAsSpectator,
  getAvailableRooms,
  handleRoomChat,
  updateRoomSettings,
  handleMultiplayerNewGame,
} from "./handlers/multiplayerHandlers.js";

import {
  connectionManager,
  validatePlayerName,
  getConnectionStats,
  cleanupExpiredSessions,
} from "./handlers/connectionHandlers.js";

// Use protected handlers
const {
  handleCardPlay,
  handleBotTurn,
  resolveRound,
  handleGameEnd,
  handlePlayerTimeout,
  startPlayerTimer,
  clearPlayerTimer,
} = protectedGameHandlers;

const {
  createMultiplayerRoom,
  joinMultiplayerRoom,
  startMultiplayerGame,
  handleMultiplayerCardPlay,
} = protectedMultiplayerHandlers;

const { handlePlayerAuth, handlePlayerReconnect, handleSocketDisconnect } =
  protectedConnectionHandlers;

const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

const manager = new GameManager();

// Setup periodic cleanup
setInterval(() => {
  cleanupExpiredSessions(connectionManager, 3600000); // 1 hour
}, 300000); // Run every 5 minutes

io.on("connection", (socket) => {
  console.log("Nova conexão:", socket.id);

  // Protect this socket against errors
  try {
    socketProtection.protectSocket(socket);
  } catch (error) {
    console.error("Erro ao proteger socket:", error.message);
    // Continue anyway - protection is optional
  }

  // Authentication and connection handlers

  // Player authentication/registration
  socket.on("auth", async ({ playerName, additionalInfo }) => {
    try {
      const result = await handlePlayerAuth(
        socket,
        playerName,
        connectionManager,
        additionalInfo,
      );

      if (result.success) {
        safeEmit(socket, "authSuccess", {
          playerName: result.playerName,
          sessionInfo: result.sessionInfo,
        });
        console.log(`Jogador autenticado: ${result.playerName}`);
      } else {
        safeEmit(socket, "authError", {
          message: result.error,
          recovered: result.recovered || false,
        });
      }
    } catch (error) {
      errorHandler.handleError(error, "authHandler", { playerName });
      safeEmit(socket, "authError", {
        message: "Erro na autenticação. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Player reconnection
  socket.on("reconnect", async ({ playerName, gameId }) => {
    try {
      const result = await handlePlayerReconnect(
        socket,
        playerName,
        connectionManager,
        manager,
      );

      if (result.success) {
        if (result.gameId) {
          socket.join(result.gameId);
        }

        safeEmit(socket, "reconnectSuccess", {
          playerName,
          gameId: result.gameId,
          gameState: result.gameState,
          disconnectedAt: result.disconnectedAt,
          reconnectedAt: result.reconnectedAt,
        });

        if (result.gameId) {
          safeEmitToRoom(io, result.gameId, "playerReconnected", {
            player: playerName,
            message: `${playerName} se reconectou`,
          });

          // Restore game flow after reconnection
          const game = manager.activeGames.get(result.gameId);
          if (
            game &&
            game.started &&
            !game.isGameFinished() &&
            !game.matchFinished
          ) {
            setTimeout(async () => {
              // If it's the reconnected player's turn, start the timer
              if (game.currentTurn === playerName) {
                console.log(
                  `Reiniciando timer para ${playerName} após reconexão`,
                );
                await startPlayerTimer(
                  result.gameId,
                  playerName,
                  io,
                  game,
                  manager,
                );
              }
              // If it's bot's turn, make the bot play
              else if (game.currentTurn === game.bot) {
                console.log(`Bot jogando após reconexão de ${playerName}`);
                await handleBotTurn(game, null, io, result.gameId);
              }
            }, 1000); // Small delay to ensure client is ready
          }
        }
      } else {
        safeEmit(socket, "reconnectError", {
          message: result.error,
          recovered: result.recovered || false,
        });
      }
    } catch (error) {
      errorHandler.handleError(error, "reconnectHandler", {
        playerName,
        gameId,
      });
      safeEmit(socket, "reconnectError", {
        message: "Erro na reconexão. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Singleplayer game handlers

  // Start singleplayer game
  socket.on("startSingleplayerGame", ({ playerName, turnTime = 30 }) => {
    try {
      const validation = validateGameStart([playerName], turnTime);
      if (!validation.valid) {
        socket.emit("gameError", { message: validation.error });
        return;
      }

      const { gameId, game } = manager.createGame(playerName, null, turnTime);
      socket.join(gameId);

      socket.emit("gameStarted", {
        gameId,
        state: game.getState(),
        players: game.players,
        isBot: true,
        gameType: "singleplayer",
      });

      // Start timer for the first player's turn
      setTimeout(() => {
        // If human starts, start player's timer
        if (game.currentTurn === playerName) {
          startPlayerTimer(gameId, playerName, io, game, manager);
        }
        // If bot starts, trigger bot play after a short thinking delay
        else if (game.currentTurn === game.bot) {
          setTimeout(() => {
            handleBotTurn(game, null, io, gameId);
          }, 1000);
        }
      }, 1000);

      console.log(
        `Jogo singleplayer iniciado: ${gameId} - ${playerName} vs Bot`,
      );
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  // Multiplayer room handlers

  // Create multiplayer room
  socket.on("createRoom", ({ playerName, roomOptions }) => {
    try {
      const result = createMultiplayerRoom(manager, playerName, roomOptions);

      if (result.success) {
        socket.join(result.gameId);
        socket.emit("roomCreated", {
          gameId: result.gameId,
          roomInfo: result.roomInfo,
        });
        console.log(`Sala criada: ${result.gameId} por ${playerName}`);
      } else {
        socket.emit("roomError", { message: result.error });
      }
    } catch (error) {
      socket.emit("roomError", { message: error.message });
    }
  });

  // Join multiplayer room
  socket.on("joinRoom", ({ gameId, playerName, password }) => {
    try {
      const result = joinMultiplayerRoom(
        manager,
        gameId,
        playerName,
        password,
        io,
      );

      if (result.success) {
        socket.join(gameId);
        socket.emit("roomJoined", {
          gameId,
          roomInfo: result.roomInfo,
          canStart: result.canStart,
        });
        console.log(`${playerName} entrou na sala ${gameId}`);
      } else {
        socket.emit("roomError", { message: result.error });
      }
    } catch (error) {
      socket.emit("roomError", { message: error.message });
    }
  });

  // Start multiplayer game
  socket.on("startMultiplayerGame", ({ gameId, playerName }) => {
    try {
      const result = startMultiplayerGame(manager, gameId, playerName, io);

      if (result.success) {
        console.log(`Jogo multiplayer iniciado: ${gameId}`);
      } else {
        socket.emit("gameError", { message: result.error });
      }
    } catch (error) {
      errorHandler.handleError(error, "playCardHandler", {
        gameId,
        playerName,
        cardFace,
      });
      safeEmit(socket, "gameError", {
        message: "Erro ao processar jogada. O jogo continua.",
        recovered: true,
      });
    }
  });

  // Leave room
  socket.on("leaveRoom", ({ gameId, playerName }) => {
    try {
      const result = leaveMultiplayerRoom(manager, gameId, playerName, io);
      socket.leave(gameId);

      socket.emit("roomLeft", { gameId });

      if (result.gameEnded) {
        console.log(`Sala ${gameId} encerrada`);
      } else if (result.roomClosed) {
        console.log(`Sala ${gameId} fechada`);
      }
    } catch (error) {
      socket.emit("roomError", { message: error.message });
    }
  });

  // Join as spectator
  socket.on("joinAsSpectator", ({ gameId, spectatorName }) => {
    try {
      const result = joinAsSpectator(manager, gameId, spectatorName, io);

      if (result.success) {
        socket.join(gameId);
        socket.emit("spectatorJoined", {
          gameId,
          roomInfo: result.roomInfo,
          gameState: result.gameState,
        });
      } else {
        socket.emit("spectatorError", { message: result.error });
      }
    } catch (error) {
      socket.emit("spectatorError", { message: error.message });
    }
  });

  // Get available rooms
  socket.on("listRooms", () => {
    try {
      const rooms = getAvailableRooms(manager);
      socket.emit("roomsList", { rooms });
    } catch (error) {
      socket.emit("listError", { message: error.message });
    }
  });

  // Update room settings
  socket.on("updateRoomSettings", ({ gameId, playerName, newSettings }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("roomError", { message: "Sala não encontrada" });
        return;
      }

      const result = updateRoomSettings(
        game,
        playerName,
        newSettings,
        io,
        gameId,
      );

      if (result.success) {
        socket.emit("roomSettingsUpdated", { roomInfo: result.roomInfo });
      } else {
        socket.emit("roomError", { message: result.error });
      }
    } catch (error) {
      socket.emit("roomError", { message: error.message });
    }
  });

  // Game play handlers

  // Play card (universal handler for both single and multiplayer)
  socket.on("playCard", async ({ gameId, playerName, cardFace }) => {
    try {
      connectionManager.updateActivity(socket.id);

      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "gameError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      // Check if multiplayer game
      if (game.roomInfo && game.roomInfo.gameStarted) {
        // Handle multiplayer card play
        const result = await handleMultiplayerCardPlay(
          game,
          playerName,
          cardFace,
          io,
          gameId,
        );

        if (!result.success) {
          safeEmit(socket, "gameError", {
            message: result.error,
            recovered: result.recovered || false,
          });
        } else if (result.gameFinished) {
          await handleGameEnd(game, io, gameId, manager);
        }
        return;
      }

      // Handle singleplayer card play
      const playResult = await handleCardPlay(
        game,
        playerName,
        cardFace,
        io,
        gameId,
      );

      if (!playResult.success) {
        safeEmit(socket, "gameError", {
          message: playResult.error,
          recovered: playResult.recovered || false,
        });
        // Restart timer if play failed and not recovered
        if (game.currentTurn === playerName && !playResult.recovered) {
          await startPlayerTimer(gameId, playerName, io, game, manager);
        }
        return;
      }

      // If it's against bot and player just played
      if (game.bot && game.playedCards.length === 1) {
        const botResult = await handleBotTurn(
          game,
          playResult.playedCard,
          io,
          gameId,
        );

        if (botResult.success) {
          // Resolve round
          const roundResult = await resolveRound(
            game,
            playResult.playedCard,
            botResult.botCard,
            playerName,
            game.bot,
            io,
            gameId,
          );

          if (roundResult.success && roundResult.gameFinished) {
            await handleGameEnd(game, io, gameId, manager);
          } else if (roundResult.success && game.currentTurn === game.bot) {
            // If bot won the round and should lead, make bot play first card
            setTimeout(async () => {
              await handleBotTurn(game, null, io, gameId);
            }, 1000); // Small delay for better UX
          } else if (roundResult.success && game.currentTurn === playerName) {
            // Start timer for player's next turn after bot play
            setTimeout(async () => {
              await startPlayerTimer(gameId, playerName, io, game, manager);
            }, 1500);
          }
        }
      } else if (game.bot && game.playedCards.length === 2) {
        // Player responded to bot's lead - resolve the round
        const [botPlay, playerPlay] = game.playedCards;

        const roundResult = await resolveRound(
          game,
          botPlay.card,
          playerPlay.card,
          game.bot,
          playerName,
          io,
          gameId,
        );

        if (roundResult.success && roundResult.gameFinished) {
          await handleGameEnd(game, io, gameId, manager);
        } else if (roundResult.success && game.currentTurn === game.bot) {
          // If bot won the round and should lead, make bot play first card
          setTimeout(async () => {
            await handleBotTurn(game, null, io, gameId);
          }, 1000);
        } else if (roundResult.success && game.currentTurn === playerName) {
          // Start timer for player's next turn after round resolution
          setTimeout(async () => {
            await startPlayerTimer(gameId, playerName, io, game, manager);
          }, 1500);
        }
      } else {
        // Check if it's bot's turn to lead a new round
        if (game.currentTurn === game.bot && game.playedCards.length === 0) {
          setTimeout(async () => {
            await handleBotTurn(game, null, io, gameId);
          }, 1000);
        } else if (game.currentTurn === playerName) {
          // Start timer for player's turn when bot leads new round
          setTimeout(async () => {
            await startPlayerTimer(gameId, playerName, io, game, manager);
          }, 1500);
        }
      }

      // Update game state
      safeEmitToRoom(io, gameId, "gameStateUpdate", {
        state: game.getState(),
        lastPlay: { player: playerName, card: cardFace },
      });

      // Start timer for next turn if it's player's turn
      setTimeout(async () => {
        if (game.currentTurn === playerName && game.playedCards.length === 0) {
          await startPlayerTimer(gameId, playerName, io, game, manager);
        }
      }, 2000);
    } catch (error) {
      errorHandler.handleError(error, "playCardHandler", {
        gameId,
        playerName,
        cardFace,
      });
      safeEmit(socket, "gameError", {
        message: "Erro ao processar jogada. O jogo continua.",
        recovered: true,
      });
    }
  });

  // Chat handlers

  // Room chat
  socket.on("roomChat", ({ gameId, playerName, message }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "chatError", {
          message: "Sala não encontrada",
          recovered: false,
        });
        return;
      }

      const result = handleRoomChat(game, playerName, message, io, gameId);

      if (!result.success) {
        safeEmit(socket, "chatError", {
          message: result.error,
          recovered: true,
        });
      }
    } catch (error) {
      errorHandler.handleError(error, "roomChatHandler", {
        gameId,
        playerName,
        messageLength: message?.length,
      });
      safeEmit(socket, "chatError", {
        message: "Erro no chat. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Game chat (for all game types)
  socket.on("gameChat", ({ gameId, playerName, message }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "chatError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      // Validate player is in game
      const isPlayer =
        game.players.includes(playerName) || game.bot === playerName;
      const isSpectator = game.roomInfo?.spectators?.includes(playerName);

      if (!isPlayer && !isSpectator) {
        safeEmit(socket, "chatError", {
          message: "Você não está neste jogo",
          recovered: false,
        });
        return;
      }

      safeEmitToRoom(io, gameId, "gameChatMessage", {
        player: playerName,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        isSpectator,
      });
    } catch (error) {
      errorHandler.handleError(error, "gameChatHandler", {
        gameId,
        playerName,
        messageLength: message?.length,
      });
      safeEmit(socket, "chatError", {
        message: "Erro no chat. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Game state handlers

  // Get game state
  socket.on("getGameState", ({ gameId }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "gameError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      const stats = getGameStats(game);
      safeEmit(socket, "gameStateResponse", {
        state: game.getState(),
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.handleError(error, "getGameStateHandler", { gameId });
      safeEmit(socket, "gameError", {
        message: "Erro ao obter estado do jogo. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Bisca match system handlers

  // Start next game in match
  socket.on("startNextGame", async ({ gameId, playerName }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "gameError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      // Check if player is authorized to start next game
      const isPlayer =
        game.players.includes(playerName) || game.bot === playerName;
      if (!isPlayer) {
        safeEmit(socket, "gameError", {
          message: "Você não está autorizado a iniciar o próximo jogo",
          recovered: false,
        });
        return;
      }

      // Check if current game is actually finished
      if (!game.isGameFinished()) {
        safeEmit(socket, "gameError", {
          message: "O jogo atual ainda não terminou",
          recovered: false,
        });
        return;
      }

      // Check if match is already finished
      if (game.isMatchFinished()) {
        safeEmit(socket, "gameError", {
          message: "A partida já terminou",
          recovered: false,
        });
        return;
      }

      const result = handleNewGameInMatch(game, io, gameId, manager);

      if (!result.success) {
        safeEmit(socket, "gameError", {
          message: result.error,
          recovered: true,
        });
      } else {
        // If bot should start the new game, trigger its play after short thinking delay
        if (game.currentTurn === game.bot) {
          setTimeout(async () => {
            await handleBotTurn(game, null, io, gameId);
          }, 1000);
        }
      }

      console.log(
        `${playerName} iniciou o jogo ${result.gameNumber} na partida ${gameId}`,
      );
    } catch (error) {
      errorHandler.handleError(error, "startNextGameHandler", {
        gameId,
        playerName,
      });
      safeEmit(socket, "gameError", {
        message: "Erro ao iniciar próximo jogo. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Get match information
  socket.on("getMatchInfo", ({ gameId }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "gameError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      safeEmit(socket, "matchInfo", {
        gameId,
        gameNumber: game.gameNumber,
        marks: { ...game.marks },
        matchFinished: game.isMatchFinished(),
        matchLeader: game.getMatchLeader(),
        currentGameFinished: game.isGameFinished(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.handleError(error, "getMatchInfoHandler", { gameId });
      safeEmit(socket, "gameError", {
        message: "Erro ao obter informações da partida. Tente novamente.",
        recovered: true,
      });
    }
  });

  // System monitoring handlers
  socket.on("getSystemHealth", () => {
    try {
      const health = errorHandler.isSystemHealthy();
      const recoveryStats = protectedHandlers.getRecoveryStats();

      safeEmit(socket, "systemHealthResponse", {
        ...health,
        recoveryStats,
        timestamp: new Date().toISOString(),
        activeGames: manager.activeGames.size,
        connectedSockets: io.engine.clientsCount,
      });
    } catch (error) {
      errorHandler.handleError(error, "systemHealthHandler");
      safeEmit(socket, "systemError", {
        message: "Erro ao verificar saúde do sistema",
        recovered: true,
      });
    }
  });

  // Get error statistics (admin only)
  socket.on("getErrorStats", ({ adminKey }) => {
    try {
      // Simple admin check - in production use proper authentication
      if (adminKey !== "admin123") {
        safeEmit(socket, "accessDenied", {
          message: "Acesso negado",
        });
        return;
      }

      const stats = errorHandler.getErrorStats();
      safeEmit(socket, "errorStatsResponse", {
        ...stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.handleError(error, "errorStatsHandler");
      safeEmit(socket, "systemError", {
        message: "Erro ao obter estatísticas",
        recovered: true,
      });
    }
  });

  // Clear error logs (admin only)
  socket.on("clearErrorLogs", ({ adminKey }) => {
    try {
      if (adminKey !== "admin123") {
        safeEmit(socket, "accessDenied", {
          message: "Acesso negado",
        });
        return;
      }

      errorHandler.clearErrorLog();
      socketProtection.resetStats();

      safeEmit(socket, "errorLogsCleared", {
        message: "Logs de erro limpos com sucesso",
        timestamp: new Date().toISOString(),
      });

      console.log("Logs de erro limpos via WebSocket");
    } catch (error) {
      errorHandler.handleError(error, "clearLogsHandler");
      safeEmit(socket, "systemError", {
        message: "Erro ao limpar logs",
        recovered: true,
      });
    }
  });

  // Start next game in multiplayer match
  socket.on("startNextMultiplayerGame", async ({ gameId, playerName }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        safeEmit(socket, "gameError", {
          message: "Jogo não encontrado",
          recovered: false,
        });
        return;
      }

      const result = handleMultiplayerNewGame(game, playerName, io, gameId);

      if (!result.success) {
        safeEmit(socket, "gameError", {
          message: result.error,
          recovered: true,
        });
      }

      console.log(
        `${playerName} iniciou o jogo ${result.gameNumber} na partida multiplayer ${gameId}`,
      );
    } catch (error) {
      errorHandler.handleError(error, "startNextMultiplayerGameHandler", {
        gameId,
        playerName,
      });
      safeEmit(socket, "gameError", {
        message: "Erro ao iniciar próximo jogo multiplayer. Tente novamente.",
        recovered: true,
      });
    }
  });

  // List active games
  socket.on("listGames", () => {
    try {
      const activeGames = manager.listActiveGames().map((gameId) => {
        const game = manager.activeGames.get(gameId);
        const stats = getGameStats(game);

        return {
          gameId,
          players: game.players,
          isBot: !!game.bot,
          started: game.started,
          isMultiplayer: !!game.roomInfo,
          roomName: game.roomInfo?.roomName,
          stats,
        };
      });

      safeEmit(socket, "gamesList", {
        games: activeGames,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.handleError(error, "listGamesHandler");
      safeEmit(socket, "listError", {
        message: "Erro ao listar jogos. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Admin/debug handlers

  // Get connection statistics
  socket.on("getConnectionStats", () => {
    try {
      const stats = getConnectionStats(connectionManager);
      const gameStats = {
        activeGames: manager.activeGames.size,
        gameIds: manager.listActiveGames(),
      };

      safeEmit(socket, "connectionStats", {
        ...stats,
        ...gameStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.handleError(error, "connectionStatsHandler");
      safeEmit(socket, "statsError", {
        message: "Erro ao obter estatísticas de conexão. Tente novamente.",
        recovered: true,
      });
    }
  });

  // Disconnect handler

  socket.on("disconnect", async (reason) => {
    console.log(`Desconexão: ${socket.id} - Motivo: ${reason}`);

    try {
      const result = await handleSocketDisconnect(
        socket,
        connectionManager,
        manager,
        io,
      );

      if (result.disconnectionInfo) {
        console.log(
          `Jogador ${result.disconnectionInfo.playerName} pode reconectar em 2 minutos`,
        );
      }

      // Clear any timers for games this player was in
      manager.activeGames.forEach(async (game, gameId) => {
        if (game.players.includes(result.disconnectionInfo?.playerName)) {
          await clearPlayerTimer(gameId);
        }
      });
    } catch (error) {
      errorHandler.handleError(error, "disconnectHandler", {
        socketId: socket.id,
        reason,
      });
      console.error(
        `Erro durante desconexão do socket ${socket.id}:`,
        error.message,
      );
    }
  });

  // Error handling

  socket.on("error", (error) => {
    errorHandler.handleError(error, "socketError", {
      socketId: socket.id,
      connected: socket.connected,
    });
    console.error(`Erro no socket ${socket.id}:`, error);

    // Try to notify client about the error if possible
    safeEmit(socket, "socketError", {
      message: "Erro de conexão detectado",
      recovered: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle activity updates
  socket.onAny(() => {
    try {
      connectionManager.updateActivity(socket.id);
    } catch (error) {
      errorHandler.handleError(error, "activityUpdateHandler", {
        socketId: socket.id,
      });
    }
  });
});

// Server startup with error protection

console.log("=== SERVIDOR WEBSOCKET COM PROTEÇÃO CONTRA ERROS ===");
console.log("Porta: 3000");
console.log("CORS: Habilitado para todas as origens");
console.log("Limpeza automática de sessões: A cada 5 minutos");
console.log("Transportes: WebSocket, Polling");
console.log("Proteção contra erros: ATIVADA");
console.log("Sistema de recuperação: ATIVADO");
console.log("Logs de erro: /logs/errors.log");
console.log("==========================================");

// Enhanced error monitoring
setInterval(() => {
  try {
    const health = errorHandler.isSystemHealthy();
    if (!health.healthy) {
      console.warn(
        `⚠️  SISTEMA DEGRADADO: ${health.errorCount} erros nas últimas 24h`,
      );
    }

    // Log active games count periodically
    const activeGamesCount = manager.activeGames.size;
    const connectionsCount = io.engine.clientsCount;

    if (activeGamesCount > 0 || connectionsCount > 0) {
      console.log(
        `📊 Status: ${activeGamesCount} jogos ativos, ${connectionsCount} conexões`,
      );
    }
  } catch (error) {
    errorHandler.handleError(error, "systemMonitoring");
  }
}, 300000); // Every 5 minutes

// Server error handlers
io.engine.on("connection_error", (error) => {
  errorHandler.handleError(error, "serverConnectionError");
});

io.on("connect_error", (error) => {
  errorHandler.handleError(error, "serverConnectError");
});

// Graceful shutdown with error protection
process.on("SIGINT", async () => {
  console.log("\n🔄 Encerrando servidor...");

  try {
    // Notify all connected clients
    safeEmitToRoom(io, undefined, "serverShutdown", {
      message: "Servidor está sendo reiniciado. Reconecte em alguns instantes.",
      timestamp: new Date().toISOString(),
    });

    // Give clients time to receive shutdown message
    setTimeout(() => {
      // Save critical game states before shutdown
      console.log("💾 Salvando estados críticos...");

      // Close server
      io.close(() => {
        console.log("✅ Servidor encerrado com sucesso");
        console.log("📊 Estatísticas finais:");
        console.log(`   - Erros totais: ${errorHandler.getErrorStats().total}`);
        console.log(`   - Jogos encerrados: ${manager.activeGames.size}`);
        process.exit(0);
      });
    }, 2000);
  } catch (error) {
    console.error("❌ Erro durante encerramento:", error.message);
    process.exit(1);
  }
});

// Handle uncaught exceptions at process level
process.on("uncaughtException", (error) => {
  console.error("🚨 EXCEÇÃO NÃO CAPTURADA:", error);
  errorHandler.handleError(error, "uncaughtException");
  // Don't exit - let the error handler manage it
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 PROMISE REJEITADA:", reason);
  errorHandler.handleError(new Error(reason), "unhandledRejection", {
    promise,
  });
  // Don't exit - let the error handler manage it
});

console.log("🚀 Servidor WebSocket pronto para conexões!");
console.log("🛡️  Sistema de proteção contra erros ATIVO");
console.log(
  "📝 Para monitoramento: ws://localhost:3000 (evento: getSystemHealth)",
);
