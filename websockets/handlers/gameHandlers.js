// Game handlers for card play, bot turns, and game logic
import { selectPlayWinner } from "../core/gameRules.js";
import { botPlay } from "./singleplayer.js";
import config from "../config.js";

// Timer management for player turns
const playerTimers = new Map(); // gameId -> { timer, player, startTime }
const TURN_TIME_LIMIT = config.timer.turnTimeLimit; // Use config value

// Start timer for a player's turn
export const startPlayerTimer = (gameId, playerName, io, game, manager) => {
  // Check if timer is enabled in config
  if (!config.timer.enabled) {
    return;
  }

  // Clear any existing timer for this game
  clearPlayerTimer(gameId);

  const startTime = Date.now();

  const timer = setTimeout(() => {
    if (config.logging.timerLogs) {
      console.log(`Timer expirou para ${playerName} no jogo ${gameId}`);
    }

    // Auto-play for the player who timed out
    const timeoutResult = handlePlayerTimeout(game, playerName, io, gameId);

    if (timeoutResult.success) {
      // If it's against bot and player just auto-played
      if (game.bot && game.playedCards.length === 1) {
        const botResult = handleBotTurn(
          game,
          timeoutResult.autoPlayedCard,
          io,
          gameId,
        );

        if (botResult.success) {
          // Resolve round
          const roundResult = resolveRound(
            game,
            timeoutResult.autoPlayedCard,
            botResult.botCard,
            playerName,
            game.bot,
            io,
            gameId,
          );

          if (roundResult.success && roundResult.gameFinished) {
            handleGameEnd(game, io, gameId, manager);
          } else if (roundResult.success && game.currentTurn === game.bot) {
            setTimeout(() => {
              handleBotTurn(game, null, io, gameId);
            }, 1000);
          }
        }
      }

      // Update game state
      io.to(gameId).emit("gameStateUpdate", {
        state: game.getState(),
        lastPlay: {
          player: playerName,
          card: timeoutResult.autoPlayedCard.getFace(),
        },
      });
    }

    // Clear the timer
    clearPlayerTimer(gameId);
  }, TURN_TIME_LIMIT);

  playerTimers.set(gameId, { timer, player: playerName, startTime });

  // Notify clients about timer start
  io.to(gameId).emit("turnTimerStarted", {
    player: playerName,
    timeLimit: TURN_TIME_LIMIT,
    startTime: startTime,
  });

  // Send timer updates based on config
  const updateInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = TURN_TIME_LIMIT - elapsed;

    if (remaining > 0) {
      io.to(gameId).emit("turnTimerUpdate", {
        player: playerName,
        timeRemaining: remaining,
      });
    } else {
      clearInterval(updateInterval);
    }
  }, config.timer.updateInterval); // Use config value

  // Store interval reference for cleanup
  const timerData = playerTimers.get(gameId);
  if (timerData) {
    timerData.updateInterval = updateInterval;
  }
};

// Clear timer for a game
export const clearPlayerTimer = (gameId) => {
  const timerData = playerTimers.get(gameId);
  if (timerData) {
    clearTimeout(timerData.timer);
    if (timerData.updateInterval) {
      clearInterval(timerData.updateInterval);
    }
    playerTimers.delete(gameId);
  }
};

// Handles a player playing a card in the game
export const handleCardPlay = (game, playerName, cardFace, io, gameId) => {
  try {
    if (game.currentTurn !== playerName) {
      return { success: false, error: "Não é sua vez" };
    }

    // Clear the timer since player made a move
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

    // Switch turn to bot after player plays
    if (game.bot) {
      game.currentTurn = game.bot;
    }

    io.to(gameId).emit("cardPlayed", {
      player: playerName,
      card: cardFace,
      remainingCards: playerHand.length,
    });

    // Emit bot's current card if it's a bot game and bot is playing next
    if (game.bot && game.currentTurn === game.bot && config.bot.showCard) {
      io.to(gameId).emit("botTurnStarted", {
        message: config.bot.messages.thinking,
      });
    }

    return { success: true, playedCard };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles the bot's turn to play a card
export const handleBotTurn = (game, playerCard, io, gameId) => {
  try {
    if (!game.bot) {
      return { success: false, error: "Não é um jogo contra bot" };
    }

    const botHand = game.hands[game.bot];
    if (!botHand || botHand.length === 0) {
      return { success: false, error: "Bot não tem cartas" };
    }

    const playerName = game.players[0];
    const assistNeeded = game.points[playerName] < game.points[game.bot];

    const suitsCounts = game.getSuitsCounts();

    const botCard = botPlay(
      playerCard,
      botHand,
      game.trumpSuit,
      assistNeeded,
      suitsCounts,
    );

    const botCardIndex = botHand.findIndex(
      (card) =>
        card.getSuit() === botCard.getSuit() &&
        card.getRank() === botCard.getRank(),
    );

    if (botCardIndex === -1) {
      return { success: false, error: "Erro interno do bot" };
    }

    botHand.splice(botCardIndex, 1);
    game.playedCards.push({ player: game.bot, card: botCard });

    // If bot is leading (no player card), switch turn to player
    // If bot is responding (player card exists), turn will be managed by resolveRound
    if (!playerCard) {
      const playerName = game.players[0];
      game.currentTurn = playerName;
    }

    io.to(gameId).emit("cardPlayed", {
      player: game.bot,
      card: botCard.getFace(),
      remainingCards: botHand.length,
    });

    // Emit bot's played card for display if enabled
    if (config.bot.showCard) {
      io.to(gameId).emit("botCardPlayed", {
        card: botCard.getFace(),
        remainingCards: botHand.length,
      });
    }

    return { success: true, botCard };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resolves a round by determining the winner and updating scores
export const resolveRound = (
  game,
  card1,
  card2,
  player1,
  player2,
  io,
  gameId,
) => {
  try {
    const result = selectPlayWinner(card1, card2, game.trumpSuit);
    const roundPoints = card1.getValue() + card2.getValue();

    const winner = result.winner === 1 ? player1 : player2;
    const loser = result.winner === 1 ? player2 : player1;

    game.addPoints(winner, roundPoints);

    // Winner of the round goes first in the next round
    game.currentTurn = winner;

    // Deal new cards if deck is not empty
    const dealtCards = {};
    if (game.deck.length > 0) {
      const winnerCard = game.dealCard();
      const loserCard = game.dealCard();

      if (winnerCard) {
        game.hands[winner].push(winnerCard);
        dealtCards[winner] = winnerCard.getFace();
      }
      if (loserCard) {
        game.hands[loser].push(loserCard);
        dealtCards[loser] = loserCard.getFace();
      }
    }

    game.clearPlayedCards();

    io.to(gameId).emit("roundResult", {
      cards: [
        { player: player1, card: card1.getFace() },
        { player: player2, card: card2.getFace() },
      ],
      winner,
      points: roundPoints,
      scores: { ...game.points },
      nextTurn: game.currentTurn,
      dealtCards,
    });

    // Clear bot card display after round ends
    io.to(gameId).emit("roundEnded", {
      winner,
      nextTurn: game.currentTurn,
    });

    return {
      success: true,
      winner,
      points: roundPoints,
      gameFinished: game.isGameFinished(),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles the end of a game and determines if match continues
export const handleGameEnd = (game, io, gameId, manager) => {
  try {
    // Clear any active timers
    clearPlayerTimer(gameId);

    const gameResult = game.determineWinner();
    const finalScores = { ...game.points };

    // Emit game ended event with Bisca scoring details
    io.to(gameId).emit("gameEnded", {
      winner: gameResult.winner,
      finalScores,
      marks: gameResult.marks,
      matchMarks: gameResult.matchMarks,
      gameNumber: game.gameNumber,
      matchFinished: gameResult.matchFinished,
      gameId,
    });

    // If match is finished, clean up the game
    if (gameResult.matchFinished) {
      const matchWinner = game.getMatchLeader();

      io.to(gameId).emit("matchEnded", {
        matchWinner,
        finalMatchMarks: gameResult.matchMarks,
        totalGames: game.gameNumber,
        gameId,
      });

      manager.removeGame(gameId);

      console.log(
        `Partida ${gameId} finalizada - Vencedor da partida: ${matchWinner} com ${gameResult.matchMarks[matchWinner]} marcas`,
      );

      return {
        success: true,
        winner: gameResult.winner,
        scores: finalScores,
        matchWinner,
        matchFinished: true,
        marks: gameResult.marks,
      };
    } else {
      // Match continues - prepare for next game
      console.log(
        `Jogo ${game.gameNumber} finalizado - Vencedor: ${gameResult.winner || "Empate"} (+${gameResult.marks} marcas)`,
      );
      console.log(`Marcas atuais: ${JSON.stringify(gameResult.matchMarks)}`);

      // Emit event to prepare for next game
      io.to(gameId).emit("nextGameReady", {
        currentMarks: gameResult.matchMarks,
        nextGameNumber: game.gameNumber + 1,
        gameId,
      });

      return {
        success: true,
        winner: gameResult.winner,
        scores: finalScores,
        matchFinished: false,
        marks: gameResult.marks,
        continuingMatch: true,
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handles automatic card play when a player times out
export const handlePlayerTimeout = (game, playerName, io, gameId) => {
  try {
    const playerHand = game.hands[playerName];
    if (!playerHand || playerHand.length === 0) {
      return { success: false, error: "Jogador não tem cartas" };
    }

    // Auto-play the lowest card when player times out
    const lowestCard = playerHand.reduce((lowest, card) =>
      card.getRank() < lowest.getRank() ? card : lowest,
    );

    const cardIndex = playerHand.findIndex(
      (card) => card.getFace() === lowestCard.getFace(),
    );
    playerHand.splice(cardIndex, 1);
    game.playedCards.push({ player: playerName, card: lowestCard });

    io.to(gameId).emit("playerTimeout", {
      player: playerName,
      autoPlayedCard: lowestCard.getFace(),
      message: `${playerName} demorou demais e jogou automaticamente`,
    });

    return { success: true, autoPlayedCard: lowestCard };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Validates game start parameters
export const validateGameStart = (players, turnTime = 30) => {
  if (!players || players.length === 0) {
    return { valid: false, error: "Pelo menos um jogador é necessário" };
  }

  if (players.length > 2) {
    return { valid: false, error: "Máximo de 2 jogadores permitido" };
  }

  if (turnTime < 5 || turnTime > 300) {
    return {
      valid: false,
      error: "Tempo de turno deve estar entre 5 e 300 segundos",
    };
  }

  const uniquePlayers = [...new Set(players)];
  if (uniquePlayers.length !== players.length) {
    return { valid: false, error: "Nomes de jogadores devem ser únicos" };
  }

  return { valid: true };
};

// Returns comprehensive game statistics including Bisca match info
export const getGameStats = (game) => {
  const stats = {
    gameId: game.gameId,
    players: game.players,
    isBot: !!game.bot,
    scores: { ...game.points },
    marks: { ...game.marks },
    trumpSuit: game.trumpSuit,
    trumpCard: game.trumpCard?.getFace(),
    currentTurn: game.currentTurn,
    cardsRemaining: Object.fromEntries(
      Object.entries(game.hands).map(([player, hand]) => [player, hand.length]),
    ),
    deckRemaining: game.deck.length,
    roundsPlayed: Math.floor(game.playedCards.length / 2),
    gameStarted: game.started,
    gameFinished: game.isGameFinished(),
    gameNumber: game.gameNumber,
    matchFinished: game.isMatchFinished(),
    matchLeader: game.getMatchLeader(),
  };

  return stats;
};

// Handles starting a new game in an ongoing match
export const handleNewGameInMatch = (game, io, gameId, manager) => {
  try {
    if (game.isMatchFinished()) {
      return { success: false, error: "A partida já terminou" };
    }

    const newGameState = game.startNewGame();

    io.to(gameId).emit("newGameStarted", {
      gameId,
      state: newGameState,
      gameNumber: game.gameNumber,
      matchMarks: { ...game.marks },
    });

    // Start timer for the first player's turn (first player defined by game's currentTurn)
    const firstPlayer = game.currentTurn;
    setTimeout(() => {
      if (game.currentTurn === firstPlayer) {
        startPlayerTimer(gameId, firstPlayer, io, game, manager);
      }
    }, 1000);

    console.log(`Novo jogo ${game.gameNumber} iniciado na partida ${gameId}`);

    return {
      success: true,
      newGameState,
      gameNumber: game.gameNumber,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
