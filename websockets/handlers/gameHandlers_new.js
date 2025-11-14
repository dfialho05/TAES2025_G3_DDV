// Game handlers for card play, bot turns, and game logic
import { selectPlayWinner } from "../core/gameRules.js";
import { botPlay } from "./singleplayer.js";
import config from "../config.js";

// Game integrity validation function
export const validateGameIntegrity = (game, gameId) => {
  const errors = [];
  const warnings = [];

  try {
    // Check basic game structure
    if (!game) {
      return {
        valid: false,
        errors: ["Game object is null or undefined"],
        warnings: [],
        summary: {},
      };
    }

    // Check game properties
    if (!game.hands) {
      errors.push("Game hands property missing");
    } else {
      // Validate hands structure
      const handKeys = Object.keys(game.hands);
      if (handKeys.length < 2) {
        errors.push(`Insufficient players: ${handKeys.length}`);
      }

      // Check each hand
      for (const [player, hand] of Object.entries(game.hands)) {
        if (!Array.isArray(hand)) {
          errors.push(`Player ${player} hand is not an array`);
        } else if (
          hand.some((card) => !card || typeof card.getFace !== "function")
        ) {
          errors.push(`Player ${player} has invalid cards`);
        }
      }

      // Check card distribution
      const totalHandCards = Object.values(game.hands).reduce(
        (sum, hand) => sum + (Array.isArray(hand) ? hand.length : 0),
        0,
      );
      const deckCards = game.deck ? game.deck.length : 0;
      const playedCards = game.playedCards ? game.playedCards.length : 0;
      const totalCards = totalHandCards + deckCards + playedCards;

      // Bisca uses 40 cards total
      if (totalCards !== 40 && totalCards !== 0) {
        warnings.push(`Unusual total card count: ${totalCards} (expected 40)`);
      }

      // Check for card count imbalance (should be at most 1 card difference)
      if (game.bot && game.hands[game.bot] && game.hands[game.players[0]]) {
        const botCards = game.hands[game.bot].length;
        const playerCards = game.hands[game.players[0]].length;
        const difference = Math.abs(botCards - playerCards);

        if (difference > 1) {
          errors.push(
            `Card imbalance: Bot(${botCards}) vs Player(${playerCards})`,
          );
        }
      }
    }

    // Check bot existence and validity
    if (game.bot) {
      if (!game.hands[game.bot]) {
        errors.push("Bot exists but has no hand");
      }
    }

    // Check current turn validity
    if (game.currentTurn) {
      const validPlayers = game.bot
        ? [game.players[0], game.bot]
        : game.players;
      if (!validPlayers.includes(game.currentTurn)) {
        errors.push(`Invalid current turn: ${game.currentTurn}`);
      }
    }

    const summary = {
      gameId,
      bot: game.bot,
      players: game.players,
      handCounts: Object.fromEntries(
        Object.entries(game.hands).map(([p, h]) => [
          p,
          Array.isArray(h) ? h.length : "invalid",
        ]),
      ),
      deckSize: game.deck ? game.deck.length : "missing",
      playedCards: game.playedCards ? game.playedCards.length : "missing",
      currentTurn: game.currentTurn,
      gameNumber: game.gameNumber,
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`],
      warnings,
      summary: { validationError: true },
    };
  }
};

// Automatic game recovery function for card distribution issues
export const attemptGameRecovery = (game, gameId, io) => {
  console.log(`Attempting game recovery for ${gameId}...`);

  try {
    // Check if we can redistribute cards from deck
    if (game.deck && game.deck.length > 0) {
      const [p1, p2] = game.bot ? [game.players[0], game.bot] : game.players;

      // Ensure both players have at least one card if deck has cards
      if (game.hands[p1].length === 0 && game.deck.length > 0) {
        const card = game.deck.pop();
        game.hands[p1].push(card);
        console.log(`Gave card to ${p1}: ${card.getFace()}`);
      }

      if (game.hands[p2].length === 0 && game.deck.length > 0) {
        const card = game.deck.pop();
        game.hands[p2].push(card);
        console.log(`Gave card to ${p2}: ${card.getFace()}`);
      }

      // Balance card distribution
      const diff = game.hands[p1].length - game.hands[p2].length;
      if (Math.abs(diff) > 1 && game.deck.length > 0) {
        const receiver = diff > 0 ? p2 : p1;
        const card = game.deck.pop();
        game.hands[receiver].push(card);
        console.log(`Balanced cards - gave ${card.getFace()} to ${receiver}`);
      }

      // Emit updated state
      io.to(gameId).emit("gameRecovered", {
        message: "Jogo recuperado - cartas redistribuídas",
        hands: Object.fromEntries(
          Object.entries(game.hands).map(([p, cards]) => [
            p,
            cards.map((c) => c.getFace()),
          ]),
        ),
      });

      return { success: true, message: "Game recovered successfully" };
    }

    // If no deck cards available, check if game should end
    const totalCards = Object.values(game.hands).reduce(
      (sum, hand) => sum + hand.length,
      0,
    );

    if (totalCards === 0) {
      console.log(`No cards remaining - ending game`);
      return { success: false, shouldEndGame: true };
    }

    return {
      success: false,
      message: "Unable to recover - insufficient cards",
    };
  } catch (error) {
    console.error(`Game recovery failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// Timer management for player turns
const playerTimers = new Map(); // gameId -> { timer, player, startTime }
const botResponseTimers = new Map(); // gameId -> { timer, retryCount, lastAttempt }
const TURN_TIME_LIMIT = config.timer.turnTimeLimit; // Use config value
const BOT_RESPONSE_TIMEOUT = config.bot.confirmation.responseTimeout;
const BOT_MAX_RETRIES = config.bot.confirmation.maxRetries;

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

    // Handle timeout - player loses the game
    const timeoutResult = handlePlayerTimeout(game, playerName, io, gameId);

    if (timeoutResult.success && timeoutResult.gameEnded) {
      // Game ended due to timeout, remove from manager if available
      if (manager) {
        manager.removeGame(gameId);
      }
      console.log(`Jogo ${gameId} terminado por timeout de ${playerName}`);
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

  // Also clear bot response timer when clearing player timer
  clearBotResponseTimer(gameId);
};

// Clear bot response timer for a game
export const clearBotResponseTimer = (gameId) => {
  const timerData = botResponseTimers.get(gameId);
  if (timerData) {
    clearTimeout(timerData.timer);
    botResponseTimers.delete(gameId);
    if (config.logging.botLogs) {
      console.log(`Bot response timer cleared for game ${gameId}`);
    }
  }
};

// Start bot response confirmation timer
export const startBotResponseTimer = (gameId, game, io) => {
  // Clear any existing timer
  clearBotResponseTimer(gameId);

  const timerData = {
    timer: null,
    retryCount: 0,
    lastAttempt: Date.now(),
  };

  const attemptBotPlay = async () => {
    if (!game.bot || game.currentTurn !== game.bot || game.isGameFinished()) {
      clearBotResponseTimer(gameId);
      return;
    }

    try {
      if (config.logging.botLogs) {
        console.log(
          `Tentativa ${timerData.retryCount + 1} de acionamento do bot para jogo ${gameId}`,
        );
      }

      // Emit retry message if this isn't the first attempt
      if (timerData.retryCount > 0) {
        io.to(gameId).emit("botStatus", {
          message: config.bot.messages.retrying,
          attempt: timerData.retryCount + 1,
          maxAttempts: BOT_MAX_RETRIES,
        });
      }

      const result = await handleBotTurn(game, null, io, gameId);

      if (result.success) {
        clearBotResponseTimer(gameId);
        if (config.logging.botLogs) {
          console.log(`Bot respondeu com sucesso no jogo ${gameId}`);
        }
      } else {
        throw new Error(result.error || "Bot falhou ao jogar");
      }
    } catch (error) {
      timerData.retryCount++;

      if (timerData.retryCount < BOT_MAX_RETRIES) {
        if (config.logging.botLogs) {
          console.log(
            `Bot falhou (tentativa ${timerData.retryCount}/${BOT_MAX_RETRIES}): ${error.message}`,
          );
        }

        // Schedule next retry with exponential backoff
        const delay = Math.min(
          config.bot.confirmation.retryBaseDelay *
            Math.pow(2, timerData.retryCount - 1),
          config.bot.confirmation.maxRetryDelay,
        );
        timerData.timer = setTimeout(attemptBotPlay, delay);
      } else {
        console.error(
          `Bot falhou definitivamente após ${BOT_MAX_RETRIES} tentativas no jogo ${gameId}: ${error.message}`,
        );
        clearBotResponseTimer(gameId);

        // Emit failure message
        io.to(gameId).emit("botStatus", {
          message: config.bot.messages.failed,
          error: error.message,
        });

        // Force timeout to end the game
        handlePlayerTimeout(game, game.bot, io, gameId);
      }
    }
  };

  // Start the initial timer
  timerData.timer = setTimeout(attemptBotPlay, BOT_RESPONSE_TIMEOUT);
  botResponseTimers.set(gameId, timerData);

  if (config.logging.botLogs) {
    console.log(
      `Bot response timer iniciado para jogo ${gameId} (timeout: ${BOT_RESPONSE_TIMEOUT}ms)`,
    );
  }
};

// Helper function to automatically trigger bot play when it's bot's turn with confirmation
export const triggerBotPlayIfNeeded = async (game, io, gameId) => {
  if (game.bot && game.currentTurn === game.bot && !game.isGameFinished()) {
    if (config.logging.botLogs) {
      console.log(`Auto-triggering bot turn for game ${gameId}`);
    }

    // Only start confirmation system if enabled
    if (config.bot.confirmation.enabled) {
      // Start bot response confirmation timer
      startBotResponseTimer(gameId, game, io);
    }

    // Emit thinking message
    io.to(gameId).emit("botStatus", {
      message: config.bot.messages.thinking,
    });

    // Initial bot play attempt with thinking delay
    setTimeout(async () => {
      try {
        const result = await handleBotTurn(game, null, io, gameId);
        if (result.success) {
          clearBotResponseTimer(gameId);
        }
      } catch (error) {
        console.warn(
          `Initial bot play attempt failed for game ${gameId}: ${error.message}`,
        );
        // Timer will handle retries if confirmation is enabled
        if (!config.bot.confirmation.enabled) {
          // If confirmation is disabled, just log the error
          console.error(`Bot definitivamente falhou: ${error.message}`);
        }
      }
    }, config.bot.thinkingTime || 1000);
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

    // Validate game integrity before proceeding
    const validation = validateGameIntegrity(game, gameId);
    if (!validation.valid) {
      console.error(
        `Game integrity check failed for ${gameId}:`,
        validation.errors,
      );
      console.error(`Game summary:`, validation.summary);
      return {
        success: false,
        error: `Integridade do jogo comprometida: ${validation.errors.join(", ")}`,
      };
    }

    if (validation.warnings.length > 0) {
      console.warn(
        `Game integrity warnings for ${gameId}:`,
        validation.warnings,
      );
    }

    // Debug logging for bot hand state
    console.log(`Bot turn debug - Game ${gameId}:`);
    console.log(`   - Bot name: ${game.bot}`);
    console.log(`   - Game hands keys: ${Object.keys(game.hands)}`);
    console.log(
      `   - Player hands: ${JSON.stringify(Object.keys(game.hands).map((p) => ({ player: p, cards: game.hands[p] ? game.hands[p].length : "undefined" })))}`,
    );
    console.log(
      `   - Deck remaining: ${game.deck ? game.deck.length : "undefined"}`,
    );
    console.log(`   - Current turn: ${game.currentTurn}`);
    console.log(
      `   - Game finished: ${game.isGameFinished ? game.isGameFinished() : "undefined"}`,
    );

    const botHand = game.hands[game.bot];

    // Enhanced validation with detailed error info
    if (!botHand) {
      console.error(`Bot hand is undefined! Game state:`, {
        botName: game.bot,
        handsKeys: Object.keys(game.hands),
        gameId: gameId,
        gameNumber: game.gameNumber || "undefined",
      });
      return { success: false, error: "Bot hand não foi inicializada" };
    }

    if (!Array.isArray(botHand)) {
      console.error(
        `Bot hand is not an array! Type: ${typeof botHand}`,
        botHand,
      );
      return { success: false, error: "Bot hand corrompida" };
    }

    if (botHand.length === 0) {
      // Check if this is a legitimate end-of-game scenario
      const playerHand = game.hands[game.players[0]];
      const totalCardsInPlay =
        (playerHand ? playerHand.length : 0) +
        botHand.length +
        (game.deck ? game.deck.length : 0);

      console.error(`Bot sem cartas! Análise completa:`, {
        botCards: botHand.length,
        playerCards: playerHand ? playerHand.length : "undefined",
        deckCards: game.deck ? game.deck.length : "undefined",
        totalCards: totalCardsInPlay,
        playedCards: game.playedCards ? game.playedCards.length : "undefined",
        gameFinished: game.isGameFinished ? game.isGameFinished() : "undefined",
        gameNumber: game.gameNumber || "undefined",
      });

      // If player also has no cards and deck is empty, this might be legitimate
      if (!playerHand || playerHand.length === 0) {
        if (game.isGameFinished && game.isGameFinished()) {
          return { success: false, error: "Jogo já finalizado" };
        }
      }

      // Attempt automatic recovery if possible
      console.log(`Attempting automatic game recovery for bot...`);
      const recoveryResult = attemptGameRecovery(game, gameId, io);

      if (recoveryResult.success) {
        console.log(
          `Game recovered successfully - bot now has ${game.hands[game.bot].length} cards`,
        );
        // Continue with bot turn after recovery
      } else if (recoveryResult.shouldEndGame) {
        console.log(`Recovery indicates game should end`);
        return { success: false, error: "Jogo finalizado - sem cartas" };
      } else {
        console.error(
          `Recovery failed: ${recoveryResult.message || recoveryResult.error}`,
        );
        return {
          success: false,
          error: "Bot não tem cartas disponíveis e recuperação falhou",
        };
      }

      // Recheck bot hand after recovery
      if (game.hands[game.bot].length === 0) {
        return {
          success: false,
          error: "Bot ainda sem cartas após recuperação",
        };
      }
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

    // Clear bot response timer since bot played successfully
    clearBotResponseTimer(gameId);

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
    clearBotResponseTimer(gameId);

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

    // Emit user-friendly victory notification
    if (gameResult.winner) {
      const winnerPoints = gameResult.points;
      const marksText =
        gameResult.marks === 3
          ? "Bandeira (120 pontos)!"
          : gameResult.marks === 2
            ? "Capote (91+ pontos)!"
            : "Vitória normal!";

      io.to(gameId).emit("playerVictory", {
        winner: gameResult.winner,
        message: `${gameResult.winner} ganhou o jogo com ${winnerPoints} pontos! ${marksText}`,
        points: winnerPoints,
        marks: gameResult.marks,
        marksDescription: marksText,
      });
    }

    // If match is finished, clean up the game
    if (gameResult.matchFinished) {
      const matchWinner = game.getMatchLeader();

      io.to(gameId).emit("matchEnded", {
        matchWinner,
        finalMatchMarks: gameResult.matchMarks,
        totalGames: game.gameNumber,
        gameId,
      });

      // Emit user-friendly match victory notification
      io.to(gameId).emit("matchVictory", {
        winner: matchWinner,
        message: `${matchWinner} venceu a partida completa!`,
        finalMarks: gameResult.matchMarks[matchWinner],
        totalGames: game.gameNumber,
        celebration: true,
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
    // Clear any active timers
    clearPlayerTimer(gameId);

    // Determine the winner (the other player)
    const [p1, p2] =
      game.players.length === 2 ? game.players : [game.players[0], game.bot];
    const winner = playerName === p1 ? p2 : p1;

    // Set maximum marks to the winner to end the match immediately
    game.marks[winner] = 4;
    game.matchFinished = true;

    // Emit timeout event
    io.to(gameId).emit("playerTimeout", {
      player: playerName,
      winner: winner,
      reason: "timeout",
      message: `${playerName} demorou demais e perdeu o jogo!`,
    });

    // Emit match ended event
    io.to(gameId).emit("matchEnded", {
      matchWinner: winner,
      finalMatchMarks: { ...game.marks },
      totalGames: game.gameNumber,
      gameId,
      reason: "timeout",
    });

    // Emit user-friendly timeout victory notification
    io.to(gameId).emit("matchVictory", {
      winner: winner,
      message: `${winner} venceu por desistência (timeout)!`,
      reason: "timeout",
      celebration: true,
    });

    console.log(`${playerName} perdeu por timeout. Vencedor: ${winner}`);

    return {
      success: true,
      gameEnded: true,
      winner: winner,
      reason: "timeout",
    };
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
export const handleNewGameInMatch = (game, io, gameId) => {
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

    // Start timer for the first player's turn
    const firstPlayer = game.players[0];
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
