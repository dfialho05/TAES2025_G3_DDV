// Multiplayer game handlers for room management and game logic
import { selectPlayWinner } from "../core/gameRules.js";
import {
  startPlayerTimer,
  clearPlayerTimer,
  resolveRound,
  handleGameEnd,
} from "./gameHandlers.js";

// Creates a new multiplayer room with specified options
export const createMultiplayerRoom = (manager, hostName, roomOptions = {}) => {
  try {
    const {
      roomName = `Sala de ${hostName}`,
      isPrivate = false,
      maxPlayers = 2,
      turnTime = 30,
      password = null,
    } = roomOptions;

    const { gameId, game } = manager.createGame(hostName, null, turnTime);

    game.roomInfo = {
      roomName,
      host: hostName,
      isPrivate,
      maxPlayers,
      password,
      createdAt: new Date().toISOString(),
      players: [hostName],
      spectators: [],
      gameStarted: false,
    };

    return {
      success: true,
      gameId,
      roomInfo: game.roomInfo,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles a player joining an existing multiplayer room
export const joinMultiplayerRoom = (
  manager,
  gameId,
  playerName,
  password,
  io,
) => {
  try {
    const game = manager.activeGames.get(gameId);
    if (!game) {
      return { success: false, error: "Sala não encontrada" };
    }

    const room = game.roomInfo;
    if (!room) {
      return { success: false, error: "Não é uma sala multiplayer" };
    }

    if (room.gameStarted) {
      return { success: false, error: "O jogo já começou" };
    }

    if (room.isPrivate && room.password !== password) {
      return { success: false, error: "Senha incorreta" };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: "Sala cheia" };
    }

    if (room.players.includes(playerName)) {
      return { success: false, error: "Nome já em uso nesta sala" };
    }

    room.players.push(playerName);
    manager.playerGames.set(playerName, gameId);

    // Update game players array to include the new player
    game.players.push(playerName);
    delete game.bot; // Remove bot since we now have 2 players

    io.to(gameId).emit("playerJoined", {
      player: playerName,
      players: room.players,
      canStart: room.players.length === 2,
    });

    return {
      success: true,
      roomInfo: room,
      canStart: room.players.length === 2,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Starts a multiplayer game when conditions are met
export const startMultiplayerGame = (manager, gameId, playerName, io) => {
  try {
    const game = manager.activeGames.get(gameId);
    if (!game) {
      return { success: false, error: "Sala não encontrada" };
    }

    const room = game.roomInfo;
    if (!room) {
      return { success: false, error: "Não é uma sala multiplayer" };
    }

    if (room.host !== playerName) {
      return {
        success: false,
        error: "Apenas o host pode iniciar o jogo",
      };
    }

    if (room.players.length < 2) {
      return {
        success: false,
        error: "Necessário 2 jogadores para iniciar",
      };
    }

    if (room.gameStarted) {
      return { success: false, error: "O jogo já foi iniciado" };
    }

    // Start the game
    const gameState = game.start();
    room.gameStarted = true;

    io.to(gameId).emit("gameStarted", {
      gameId,
      state: gameState,
      players: game.players,
      isBot: false,
      gameType: "multiplayer",
      roomInfo: room,
    });

    // Start timer for the first player's turn
    setTimeout(() => {
      if (game.currentTurn && !game.isGameFinished()) {
        startPlayerTimer(gameId, game.currentTurn, io, game, manager);
      }
    }, 1000);

    return { success: true, gameState };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles a player leaving a multiplayer room
export const leaveMultiplayerRoom = (manager, gameId, playerName, io) => {
  try {
    const game = manager.activeGames.get(gameId);
    if (!game) {
      return { success: false, error: "Sala não encontrada" };
    }

    const room = game.roomInfo;
    if (!room) {
      return { success: false, error: "Não é uma sala multiplayer" };
    }

    const playerIndex = room.players.indexOf(playerName);
    if (playerIndex === -1) {
      return { success: false, error: "Jogador não está na sala" };
    }

    room.players.splice(playerIndex, 1);
    manager.playerGames.delete(playerName);

    if (room.gameStarted) {
      io.to(gameId).emit("gameAbandoned", {
        reason: `${playerName} abandonou o jogo`,
        winner: room.players[0] || null,
      });
      manager.removeGame(gameId);
      return { success: true, gameEnded: true };
    }

    if (room.host === playerName && room.players.length > 0) {
      room.host = room.players[0];
      io.to(gameId).emit("newHost", { newHost: room.host });
    }

    if (room.players.length === 0) {
      manager.removeGame(gameId);
      return { success: true, roomClosed: true };
    }

    io.to(gameId).emit("playerLeft", {
      player: playerName,
      players: room.players,
      newHost: room.host,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles card play in multiplayer games
export const handleMultiplayerCardPlay = (
  game,
  playerName,
  cardFace,
  io,
  gameId,
) => {
  try {
    if (!game.roomInfo || !game.roomInfo.gameStarted) {
      return { success: false, error: "Não é um jogo multiplayer ativo" };
    }

    if (game.currentTurn !== playerName) {
      return { success: false, error: "Não é sua vez" };
    }

    // Clear any active timer since player made a move
    clearPlayerTimer(gameId);

    const playerHand = game.hands[playerName];
    const cardIndex = playerHand.findIndex(
      (card) => card.getFace() === cardFace,
    );

    if (cardIndex === -1) {
      return { success: false, error: "Carta não encontrada na sua mão" };
    }

    const playedCard = playerHand[cardIndex];
    // Get the lead card of the current round (first card played in this round)
    const leadCard =
      game.playedCards.length === 1 ? game.playedCards[0].card : null;

    const validation = game.validatePlay(playerName, cardFace, leadCard);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    playerHand.splice(cardIndex, 1);
    game.playedCards.push({ player: playerName, card: playedCard });

    // Switch turn to the other player
    const otherPlayer = game.roomInfo.players.find((p) => p !== playerName);
    game.currentTurn = otherPlayer;

    io.to(gameId).emit("cardPlayed", {
      player: playerName,
      card: cardFace,
      remainingCards: playerHand.length,
      isMultiplayer: true,
    });

    // If both players have played cards, resolve the round
    if (game.playedCards.length === 2) {
      const [play1, play2] = game.playedCards;

      const roundResult = resolveRound(
        game,
        play1.card,
        play2.card,
        play1.player,
        play2.player,
        io,
        gameId,
      );

      if (roundResult.success && roundResult.gameFinished) {
        return handleGameEnd(game, io, gameId, null);
      } else if (roundResult.success) {
        // Start timer for next turn
        setTimeout(() => {
          if (game.currentTurn && !game.isGameFinished()) {
            startPlayerTimer(gameId, game.currentTurn, io, game, null);
          }
        }, 1500);
      }
    } else {
      // First card played, start timer for second player
      setTimeout(() => {
        if (game.currentTurn && !game.isGameFinished()) {
          startPlayerTimer(gameId, game.currentTurn, io, game, null);
        }
      }, 500);
    }

    return {
      success: true,
      gameFinished: game.isGameFinished(),
      playedCard,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Allows a user to join a room as a spectator
export const joinAsSpectator = (manager, gameId, spectatorName, io) => {
  try {
    const game = manager.activeGames.get(gameId);
    if (!game) {
      return { success: false, error: "Sala não encontrada" };
    }

    const room = game.roomInfo;
    if (!room) {
      return { success: false, error: "Não é uma sala multiplayer" };
    }

    if (room.spectators.includes(spectatorName)) {
      return { success: false, error: "Já está assistindo" };
    }

    if (room.players.includes(spectatorName)) {
      return { success: false, error: "Você já é um jogador nesta sala" };
    }

    room.spectators.push(spectatorName);

    io.to(gameId).emit("spectatorJoined", {
      spectator: spectatorName,
      spectators: room.spectators,
    });

    return {
      success: true,
      roomInfo: room,
      gameState: room.gameStarted ? game.getState() : null,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Returns list of available public rooms
export const getAvailableRooms = (manager) => {
  try {
    const rooms = [];
    manager.activeGames.forEach((game, gameId) => {
      if (game.roomInfo && !game.roomInfo.isPrivate) {
        rooms.push({
          gameId,
          roomName: game.roomInfo.roomName,
          host: game.roomInfo.host,
          players: game.roomInfo.players.length,
          maxPlayers: game.roomInfo.maxPlayers,
          gameStarted: game.roomInfo.gameStarted,
          spectators: game.roomInfo.spectators.length,
        });
      }
    });
    return rooms;
  } catch (error) {
    return [];
  }
};

// Handles chat messages in multiplayer rooms
export const handleRoomChat = (game, playerName, message, io, gameId) => {
  try {
    if (!game.roomInfo) {
      return { success: false, error: "Esta não é uma sala multiplayer" };
    }

    const isPlayer = game.roomInfo.players.includes(playerName);
    const isSpectator = game.roomInfo.spectators.includes(playerName);

    if (!isPlayer && !isSpectator) {
      return { success: false, error: "Você não está nesta sala" };
    }

    io.to(gameId).emit("roomChatMessage", {
      player: playerName,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isSpectator,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles starting a new game in multiplayer match
export const handleMultiplayerNewGame = (game, playerName, io, gameId) => {
  try {
    if (!game.roomInfo) {
      return { success: false, error: "Esta não é uma sala multiplayer" };
    }

    // Check if player is authorized (must be a player, not spectator)
    if (!game.roomInfo.players.includes(playerName)) {
      return {
        success: false,
        error: "Apenas jogadores podem iniciar novo jogo",
      };
    }

    // Check if current game is finished
    if (!game.isGameFinished()) {
      return { success: false, error: "O jogo atual ainda não terminou" };
    }

    // Check if match is finished
    if (game.isMatchFinished()) {
      return { success: false, error: "A partida já terminou" };
    }

    // Start new game
    const newGameState = game.startNewGame();

    io.to(gameId).emit("newGameStarted", {
      gameId,
      state: newGameState,
      gameNumber: game.gameNumber,
      matchMarks: { ...game.marks },
      roomInfo: game.roomInfo,
    });

    // Start timer for the first player's turn
    setTimeout(() => {
      if (game.currentTurn && !game.isGameFinished()) {
        startPlayerTimer(gameId, game.currentTurn, io, game, null);
      }
    }, 1000);

    return { success: true, gameNumber: game.gameNumber };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Updates room settings (host only)
export const updateRoomSettings = (game, playerName, newSettings, io, gameId) => {
  try {
    if (!game.roomInfo) {
      return { success: false, error: "Não é uma sala multiplayer" };
    }

    if (game.roomInfo.host !== playerName) {
      return { success: false, error: "Apenas o host pode alterar configurações" };
    }

    if (game.roomInfo.gameStarted) {
      return { success: false, error: "Não é possível alterar configurações durante o jogo" };
    }

    // Update allowed settings
    const allowedSettings = ['roomName', 'isPrivate', 'password'];
    Object.keys(newSettings).forEach(key => {
      if (allowedSettings.includes(key)) {
        game.roomInfo[key] = newSettings[key];
      }
    });

    io.to(gameId).emit("roomSettingsUpdated", {
      roomInfo: game.roomInfo,
      updatedBy: playerName,
    });

    return { success: true, roomInfo: game.roomInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
