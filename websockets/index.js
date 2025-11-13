import { Server } from "socket.io";
import { GameManager } from "./handlers/gameManager.js";
import { botPlay } from "./handlers/singleplayer.js";
import { selectPlayWinner, doAPlay } from "./core/gameRules.js";
import { Card } from "./core/CardClass.js";

// Import all handlers
import {
  handleCardPlay,
  handleBotTurn,
  resolveRound,
  handleGameEnd,
  handlePlayerTimeout,
  validateGameStart,
  getGameStats,
  startPlayerTimer,
  clearPlayerTimer,
  handleNewGameInMatch,
} from "./handlers/gameHandlers.js";

import {
  createMultiplayerRoom,
  joinMultiplayerRoom,
  startMultiplayerGame,
  leaveMultiplayerRoom,
  handleMultiplayerCardPlay,
  joinAsSpectator,
  getAvailableRooms,
  handleRoomChat,
  updateRoomSettings,
  handleMultiplayerNewGame,
} from "./handlers/multiplayerHandlers.js";

import {
  connectionManager,
  validatePlayerName,
  handlePlayerAuth,
  handlePlayerReconnect,
  handleSocketDisconnect,
  getConnectionStats,
  cleanupExpiredSessions,
} from "./handlers/connectionHandlers.js";

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

  // Authentication and connection handlers

  // Player authentication/registration
  socket.on("auth", ({ playerName, additionalInfo }) => {
    const result = handlePlayerAuth(
      socket,
      playerName,
      connectionManager,
      additionalInfo,
    );

    if (result.success) {
      socket.emit("authSuccess", {
        playerName: result.playerName,
        sessionInfo: result.sessionInfo,
      });
      console.log(`Jogador autenticado: ${result.playerName}`);
    } else {
      socket.emit("authError", { message: result.error });
    }
  });

  // Player reconnection
  socket.on("reconnect", ({ playerName, gameId }) => {
    const result = handlePlayerReconnect(
      socket,
      playerName,
      connectionManager,
      manager,
    );

    if (result.success) {
      if (result.gameId) {
        socket.join(result.gameId);
      }

      socket.emit("reconnectSuccess", {
        playerName,
        gameId: result.gameId,
        gameState: result.gameState,
        disconnectedAt: result.disconnectedAt,
        reconnectedAt: result.reconnectedAt,
      });

      if (result.gameId) {
        socket.to(result.gameId).emit("playerReconnected", {
          player: playerName,
          message: `${playerName} se reconectou`,
        });
      }
    } else {
      socket.emit("reconnectError", { message: result.error });
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
        if (game.currentTurn === playerName) {
          startPlayerTimer(gameId, playerName, io, game, manager);
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
      socket.emit("gameError", { message: error.message });
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
  socket.on("playCard", ({ gameId, playerName, cardFace }) => {
    try {
      connectionManager.updateActivity(socket.id);

      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      // Check if multiplayer game
      if (game.roomInfo && game.roomInfo.gameStarted) {
        // Handle multiplayer card play
        const result = handleMultiplayerCardPlay(
          game,
          playerName,
          cardFace,
          io,
          gameId,
        );

        if (!result.success) {
          socket.emit("gameError", { message: result.error });
        } else if (result.gameFinished) {
          handleGameEnd(game, io, gameId, manager);
        }
        return;
      }

      // Handle singleplayer card play
      const playResult = handleCardPlay(game, playerName, cardFace, io, gameId);

      if (!playResult.success) {
        socket.emit("gameError", { message: playResult.error });
        // Restart timer if play failed
        if (game.currentTurn === playerName) {
          startPlayerTimer(gameId, playerName, io, game, manager);
        }
        return;
      }

      // If it's against bot and player just played
      if (game.bot && game.playedCards.length === 1) {
        const botResult = handleBotTurn(
          game,
          playResult.playedCard,
          io,
          gameId,
        );

        if (botResult.success) {
          // Resolve round
          const roundResult = resolveRound(
            game,
            playResult.playedCard,
            botResult.botCard,
            playerName,
            game.bot,
            io,
            gameId,
          );

          if (roundResult.success && roundResult.gameFinished) {
            handleGameEnd(game, io, gameId, manager);
          } else if (roundResult.success && game.currentTurn === game.bot) {
            // If bot won the round and should lead, make bot play first card
            setTimeout(() => {
              handleBotTurn(game, null, io, gameId);
            }, 1000); // Small delay for better UX
          } else if (roundResult.success && game.currentTurn === playerName) {
            // Start timer for player's next turn after bot play
            setTimeout(() => {
              startPlayerTimer(gameId, playerName, io, game, manager);
            }, 1500);
          }
        }
      } else if (game.bot && game.playedCards.length === 2) {
        // Player responded to bot's lead - resolve the round
        const [botPlay, playerPlay] = game.playedCards;

        const roundResult = resolveRound(
          game,
          botPlay.card,
          playerPlay.card,
          game.bot,
          playerName,
          io,
          gameId,
        );

        if (roundResult.success && roundResult.gameFinished) {
          handleGameEnd(game, io, gameId, manager);
        } else if (roundResult.success && game.currentTurn === game.bot) {
          // If bot won the round and should lead, make bot play first card
          setTimeout(() => {
            handleBotTurn(game, null, io, gameId);
          }, 1000);
        } else if (roundResult.success && game.currentTurn === playerName) {
          // Start timer for player's next turn after round resolution
          setTimeout(() => {
            startPlayerTimer(gameId, playerName, io, game, manager);
          }, 1500);
        }
      } else {
        // Check if it's bot's turn to lead a new round
        if (game.currentTurn === game.bot && game.playedCards.length === 0) {
          setTimeout(() => {
            handleBotTurn(game, null, io, gameId);
          }, 1000);
        } else if (game.currentTurn === playerName) {
          // Start timer for player's turn when bot leads new round
          setTimeout(() => {
            startPlayerTimer(gameId, playerName, io, game, manager);
          }, 1500);
        }
      }

      // Update game state
      io.to(gameId).emit("gameStateUpdate", {
        state: game.getState(),
        lastPlay: { player: playerName, card: cardFace },
      });

      // Start timer for next turn if it's player's turn
      setTimeout(() => {
        if (game.currentTurn === playerName && game.playedCards.length === 0) {
          startPlayerTimer(gameId, playerName, io, game, manager);
        }
      }, 2000);
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  // Chat handlers

  // Room chat
  socket.on("roomChat", ({ gameId, playerName, message }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("chatError", { message: "Sala não encontrada" });
        return;
      }

      const result = handleRoomChat(game, playerName, message, io, gameId);

      if (!result.success) {
        socket.emit("chatError", { message: result.error });
      }
    } catch (error) {
      socket.emit("chatError", { message: error.message });
    }
  });

  // Game chat (for all game types)
  socket.on("gameChat", ({ gameId, playerName, message }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("chatError", { message: "Jogo não encontrado" });
        return;
      }

      // Validate player is in game
      const isPlayer =
        game.players.includes(playerName) || game.bot === playerName;
      const isSpectator = game.roomInfo?.spectators?.includes(playerName);

      if (!isPlayer && !isSpectator) {
        socket.emit("chatError", { message: "Você não está neste jogo" });
        return;
      }

      io.to(gameId).emit("gameChatMessage", {
        player: playerName,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        isSpectator,
      });
    } catch (error) {
      socket.emit("chatError", { message: error.message });
    }
  });

  // Game state handlers

  // Get game state
  socket.on("getGameState", ({ gameId }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      const stats = getGameStats(game);
      socket.emit("gameStateResponse", {
        gameId,
        state: game.getState(),
        stats,
        roomInfo: game.roomInfo,
      });
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  // Bisca match system handlers

  // Start next game in match
  socket.on("startNextGame", ({ gameId, playerName }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      // Check if player is authorized to start next game
      const isPlayer =
        game.players.includes(playerName) || game.bot === playerName;
      if (!isPlayer) {
        socket.emit("gameError", {
          message: "Você não está autorizado a iniciar o próximo jogo",
        });
        return;
      }

      // Check if current game is actually finished
      if (!game.isGameFinished()) {
        socket.emit("gameError", {
          message: "O jogo atual ainda não terminou",
        });
        return;
      }

      // Check if match is already finished
      if (game.isMatchFinished()) {
        socket.emit("gameError", { message: "A partida já terminou" });
        return;
      }

      const result = handleNewGameInMatch(game, io, gameId);

      if (!result.success) {
        socket.emit("gameError", { message: result.error });
      }

      console.log(
        `${playerName} iniciou o jogo ${result.gameNumber} na partida ${gameId}`,
      );
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  // Get match information
  socket.on("getMatchInfo", ({ gameId }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      socket.emit("matchInfo", {
        gameId,
        gameNumber: game.gameNumber,
        marks: { ...game.marks },
        matchFinished: game.isMatchFinished(),
        matchLeader: game.getMatchLeader(),
        currentGameFinished: game.isGameFinished(),
      });
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  // Start next game in multiplayer match
  socket.on("startNextMultiplayerGame", ({ gameId, playerName }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      const result = handleMultiplayerNewGame(game, playerName, io, gameId);

      if (!result.success) {
        socket.emit("gameError", { message: result.error });
      }

      console.log(
        `${playerName} iniciou o jogo ${result.gameNumber} na partida multiplayer ${gameId}`,
      );
    } catch (error) {
      socket.emit("gameError", { message: error.message });
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

      socket.emit("gamesList", { games: activeGames });
    } catch (error) {
      socket.emit("listError", { message: error.message });
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

      socket.emit("connectionStats", {
        ...stats,
        ...gameStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      socket.emit("statsError", { message: error.message });
    }
  });

  // Disconnect handler

  socket.on("disconnect", (reason) => {
    console.log(`Desconexão: ${socket.id} - Motivo: ${reason}`);

    const result = handleSocketDisconnect(
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
    manager.activeGames.forEach((game, gameId) => {
      if (game.players.includes(result.disconnectionInfo?.playerName)) {
        clearPlayerTimer(gameId);
      }
    });
  });

  // Error handling

  socket.on("error", (error) => {
    console.error(`Erro no socket ${socket.id}:`, error);
  });

  // Handle activity updates
  socket.onAny(() => {
    connectionManager.updateActivity(socket.id);
  });
});

// Server startup

console.log("Servidor WebSocket iniciando...");
console.log("Porta: 3000");
console.log("CORS: Habilitado para todas as origens");
console.log("Limpeza automática de sessões: A cada 5 minutos");
console.log("Transportes: WebSocket, Polling");

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nEncerrando servidor...");

  // Notify all connected clients
  io.emit("serverShutdown", {
    message: "Servidor está sendo reiniciado. Reconecte em alguns instantes.",
    timestamp: new Date().toISOString(),
  });

  // Close server
  io.close(() => {
    console.log("Servidor encerrado com sucesso");
    process.exit(0);
  });
});

console.log("Servidor WebSocket pronto para conexões!");
