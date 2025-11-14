// Protected handlers that wrap existing handlers with error protection
// This ensures the game continues even when errors occur

import errorHandler, {
  wrapHandler,
  safeEmit,
  safeEmitToRoom,
} from "../core/errorHandler.js";
import socketProtection from "../middleware/socketProtection.js";

// Import original handlers
import * as gameHandlers from "./gameHandlers.js";
import {
  triggerBotPlayIfNeeded,
  clearBotResponseTimer,
  startBotResponseTimer,
} from "./gameHandlers.js";
import * as multiplayerHandlers from "./multiplayerHandlers.js";
import * as connectionHandlers from "./connectionHandlers.js";

class ProtectedHandlers {
  constructor() {
    this.activeRecoveries = new Map(); // Track ongoing recoveries
    this.gameStates = new Map(); // Backup game states for recovery
  }

  // Protect all game handlers
  createProtectedGameHandlers() {
    return {
      handleCardPlay: wrapHandler(
        "gameHandler",
        async (game, playerName, cardFace, io, gameId) => {
          try {
            // Backup game state before action
            this.backupGameState(gameId, game);

            const result = await gameHandlers.handleCardPlay(
              game,
              playerName,
              cardFace,
              io,
              gameId,
            );

            if (!result.success) {
              // If play failed, restore from backup if needed
              this.recoverGameFromError(
                gameId,
                game,
                io,
                new Error("Card play failed"),
                null,
              );
            }

            return result;
          } catch (error) {
            // Attempt to recover game state
            const recovered = this.recoverGameFromError(
              gameId,
              game,
              io,
              error,
              null,
            );

            return {
              success: false,
              error: "Erro na jogada, mas o jogo continua",
              recovered: recovered,
            };
          }
        },
      ),

      handleBotTurn: wrapHandler(
        "botHandler",
        async (game, playerCard, io, gameId) => {
          try {
            return await gameHandlers.handleBotTurn(
              game,
              playerCard,
              io,
              gameId,
            );
          } catch (error) {
            // If bot fails, create a simple fallback play
            return this.createFallbackBotPlay(game, io, gameId);
          }
        },
      ),

      resolveRound: wrapHandler(
        "roundHandler",
        async (game, card1, card2, player1, player2, io, gameId) => {
          try {
            return await gameHandlers.resolveRound(
              game,
              card1,
              card2,
              player1,
              player2,
              io,
              gameId,
            );
          } catch (error) {
            // If round resolution fails, create safe resolution
            return this.safeFallbackRoundResolution(
              game,
              card1,
              card2,
              player1,
              player2,
              io,
              gameId,
            );
          }
        },
      ),

      handleGameEnd: wrapHandler(
        "gameEndHandler",
        async (game, io, gameId, manager) => {
          try {
            return await gameHandlers.handleGameEnd(game, io, gameId, manager);
          } catch (error) {
            // Ensure game is properly cleaned up even if end handler fails
            return this.forceGameCleanup(gameId, manager, io);
          }
        },
      ),

      handlePlayerTimeout: wrapHandler(
        "timeoutHandler",
        async (game, playerName, io, gameId) => {
          try {
            return await gameHandlers.handlePlayerTimeout(
              game,
              playerName,
              io,
              gameId,
            );
          } catch (error) {
            // Create safe auto-play for timeout
            return this.safeAutoPlay(game, playerName, io, gameId);
          }
        },
      ),

      startPlayerTimer: wrapHandler(
        "timerHandler",
        async (gameId, playerName, io, game, manager) => {
          try {
            return await gameHandlers.startPlayerTimer(
              gameId,
              playerName,
              io,
              game,
              manager,
            );
          } catch (error) {
            // Timer errors shouldn't break the game
            console.warn(
              `Timer falhou para ${playerName} no jogo ${gameId}, continuando sem timer`,
            );
            return { success: true, timerDisabled: true };
          }
        },
      ),

      clearPlayerTimer: wrapHandler("timerClearHandler", async (gameId) => {
        try {
          await gameHandlers.clearPlayerTimer(gameId);
          clearBotResponseTimer(gameId);
          return { success: true };
        } catch (error) {
          // Clearing timer errors are non-critical
          console.warn(
            `Erro ao limpar timer do jogo ${gameId}:`,
            error.message,
          );
          return {
            success: true,
            warning: "Timer cleanup failed but continuing",
          };
        }
      }),
    };
  }

  // Protect multiplayer handlers
  createProtectedMultiplayerHandlers() {
    return {
      createMultiplayerRoom: wrapHandler(
        "roomCreation",
        async (manager, playerName, roomOptions) => {
          try {
            return await multiplayerHandlers.createMultiplayerRoom(
              manager,
              playerName,
              roomOptions,
            );
          } catch (error) {
            return {
              success: false,
              error: "Erro ao criar sala. Tente novamente.",
              recovered: true,
            };
          }
        },
      ),

      joinMultiplayerRoom: wrapHandler(
        "roomJoin",
        async (manager, gameId, playerName, password, io) => {
          try {
            return await multiplayerHandlers.joinMultiplayerRoom(
              manager,
              gameId,
              playerName,
              password,
              io,
            );
          } catch (error) {
            return {
              success: false,
              error: "Erro ao entrar na sala. Verifique se ela ainda existe.",
              recovered: true,
            };
          }
        },
      ),

      startMultiplayerGame: wrapHandler(
        "multiplayerStart",
        async (manager, gameId, playerName, io) => {
          try {
            return await multiplayerHandlers.startMultiplayerGame(
              manager,
              gameId,
              playerName,
              io,
            );
          } catch (error) {
            return {
              success: false,
              error:
                "Erro ao iniciar jogo. Todos os jogadores estão conectados?",
              recovered: true,
            };
          }
        },
      ),

      handleMultiplayerCardPlay: wrapHandler(
        "multiplayerPlay",
        async (game, playerName, cardFace, io, gameId) => {
          try {
            // Backup multiplayer game state
            this.backupGameState(gameId, game);

            return await multiplayerHandlers.handleMultiplayerCardPlay(
              game,
              playerName,
              cardFace,
              io,
              gameId,
            );
          } catch (error) {
            // Attempt recovery for multiplayer
            this.recoverMultiplayerGame(gameId, game, io, error);

            return {
              success: false,
              error: "Erro na jogada. O jogo continua.",
              recovered: true,
            };
          }
        },
      ),
    };
  }

  // Protect connection handlers
  createProtectedConnectionHandlers() {
    return {
      handlePlayerAuth: wrapHandler(
        "auth",
        async (socket, playerName, connectionManager, additionalInfo) => {
          try {
            return await connectionHandlers.handlePlayerAuth(
              socket,
              playerName,
              connectionManager,
              additionalInfo,
            );
          } catch (error) {
            return {
              success: false,
              error: "Erro na autenticação. Tente novamente.",
              recovered: true,
            };
          }
        },
      ),

      handlePlayerReconnect: wrapHandler(
        "reconnect",
        async (socket, playerName, connectionManager, manager) => {
          try {
            return await connectionHandlers.handlePlayerReconnect(
              socket,
              playerName,
              connectionManager,
              manager,
            );
          } catch (error) {
            return {
              success: false,
              error: "Erro na reconexão. Tente entrar novamente.",
              recovered: true,
            };
          }
        },
      ),

      handleSocketDisconnect: wrapHandler(
        "disconnect",
        async (socket, connectionManager, manager, io) => {
          try {
            return await connectionHandlers.handleSocketDisconnect(
              socket,
              connectionManager,
              manager,
              io,
            );
          } catch (error) {
            // Disconnect errors shouldn't prevent cleanup
            console.warn(
              "Erro durante desconexão, mas limpeza continua:",
              error.message,
            );
            return {
              success: true,
              warning: "Disconnect cleanup had errors but completed",
            };
          }
        },
      ),
    };
  }

  // Backup game state for recovery
  backupGameState(gameId, game) {
    try {
      if (!game) return;

      // Safe backup with improved card serialization
      const safeHands = {};
      if (game.hands) {
        for (const [player, cards] of Object.entries(game.hands)) {
          if (Array.isArray(cards)) {
            safeHands[player] = cards
              .map((card) => {
                try {
                  if (card && typeof card.getFace === "function") {
                    return {
                      face: card.getFace(),
                      suit: card.suit || null,
                      value: card.value || null,
                      rank: card.rank || null,
                      isCard: true,
                    };
                  } else if (card && card.face) {
                    return {
                      face: card.face,
                      suit: card.suit || null,
                      value: card.value || null,
                      rank: card.rank || null,
                      isCard: true,
                    };
                  }
                  return null;
                } catch (cardError) {
                  console.warn(`Erro ao serializar carta:`, cardError.message);
                  return null;
                }
              })
              .filter((card) => card !== null);
          } else {
            safeHands[player] = [];
          }
        }
      }

      const safePlayedCards = [];
      if (Array.isArray(game.playedCards)) {
        for (const playedCard of game.playedCards) {
          try {
            if (playedCard && playedCard.card) {
              const card = playedCard.card;
              let cardData = null;

              if (typeof card.getFace === "function") {
                cardData = {
                  face: card.getFace(),
                  suit: card.suit || null,
                  value: card.value || null,
                  rank: card.rank || null,
                  isCard: true,
                };
              } else if (card.face) {
                cardData = {
                  face: card.face,
                  suit: card.suit || null,
                  value: card.value || null,
                  rank: card.rank || null,
                  isCard: true,
                };
              }

              if (cardData) {
                safePlayedCards.push({
                  player: playedCard.player,
                  card: cardData,
                });
              }
            }
          } catch (playedCardError) {
            console.warn(
              `Erro ao serializar carta jogada:`,
              playedCardError.message,
            );
          }
        }
      }

      // Backup deck
      const safeDeck = [];
      if (Array.isArray(game.deck)) {
        for (const card of game.deck) {
          try {
            if (card && typeof card.getFace === "function") {
              safeDeck.push({
                face: card.getFace(),
                suit: card.suit || null,
                value: card.value || null,
                rank: card.rank || null,
                isCard: true,
              });
            } else if (card && card.face) {
              safeDeck.push({
                face: card.face,
                suit: card.suit || null,
                value: card.value || null,
                rank: card.rank || null,
                isCard: true,
              });
            }
          } catch (deckCardError) {
            console.warn(
              `Erro ao serializar carta do deck:`,
              deckCardError.message,
            );
          }
        }
      }

      // Backup trump card
      let safeTrumpCard = null;
      if (game.trumpCard && typeof game.trumpCard.getFace === "function") {
        safeTrumpCard = {
          face: game.trumpCard.getFace(),
          suit: game.trumpCard.suit || null,
          value: game.trumpCard.value || null,
          rank: game.trumpCard.rank || null,
          isCard: true,
        };
      }

      this.gameStates.set(gameId, {
        timestamp: Date.now(),
        hands: safeHands,
        points: game.points ? { ...game.points } : {},
        currentTurn: game.currentTurn || null,
        playedCards: safePlayedCards,
        deck: safeDeck,
        deckCount: game.deck ? game.deck.length : 0,
        trumpCard: safeTrumpCard,
        trumpSuit: game.trumpSuit || null,
        started: game.started || false,
        gameNumber: game.gameNumber || 1,
        marks: game.marks ? { ...game.marks } : {},
        matchFinished: game.matchFinished || false,
        gameId: gameId,
      });

      console.log(
        `✅ Backup criado para jogo ${gameId}:`,
        `${Object.keys(safeHands).length} jogadores,`,
        `${safeDeck.length} cartas no deck,`,
        `${safePlayedCards.length} cartas jogadas`,
      );
    } catch (error) {
      console.warn(`❌ Erro ao fazer backup do jogo ${gameId}:`, error.message);
    }
  }

  // Reconstruct card objects from backup data
  reconstructCards(cardData) {
    if (!Array.isArray(cardData)) return [];

    return cardData
      .map((card) => {
        try {
          if (card && card.face && card.isCard) {
            // Create a simple card object with all necessary methods
            return {
              getFace: () => card.face,
              getSuit: () => card.suit,
              getRank: () => card.rank || this.extractRankFromFace(card.face),
              getValue: () => card.value,
              suit: card.suit,
              value: card.value,
              rank: card.rank || this.extractRankFromFace(card.face),
              face: card.face,
              toString: () => card.face,
              isReconstructed: true,
            };
          }
          return null;
        } catch (error) {
          console.warn(`Erro ao reconstruir carta:`, error.message);
          return null;
        }
      })
      .filter((card) => card !== null);
  }

  // Helper function to extract rank from card face
  extractRankFromFace(face) {
    if (!face) return 0;
    const rankStr = face.slice(1); // Remove suit character
    const rankNum = parseInt(rankStr);

    // Map card values to ranks (order)
    const cardValues = {
      2: 1,
      3: 2,
      4: 3,
      5: 4,
      6: 5,
      12: 6,
      11: 7,
      13: 8,
      7: 9,
      1: 10,
    };

    return cardValues[rankNum] || 0;
  }

  // Attempt to recover game from error
  recoverGameFromError(gameId, game, io, error, manager = null) {
    try {
      console.log(
        `Tentando recuperar jogo ${gameId} após erro:`,
        error.message,
      );

      // Get backup state
      const backup = this.gameStates.get(gameId);
      if (backup && backup.timestamp > Date.now() - 30000) {
        // 30 seconds old max
        try {
          // Restore critical game properties with card reconstruction
          if (backup.hands && typeof backup.hands === "object") {
            game.hands = game.hands || {};
            for (const [player, cards] of Object.entries(backup.hands)) {
              if (Array.isArray(cards)) {
                game.hands[player] = this.reconstructCards(cards);
              }
            }
          }

          if (backup.points && typeof backup.points === "object") {
            game.points = { ...backup.points };
          }

          if (backup.currentTurn) {
            game.currentTurn = backup.currentTurn;
          }

          if (Array.isArray(backup.playedCards)) {
            game.playedCards = [];
            for (const playedCard of backup.playedCards) {
              if (playedCard && playedCard.card && playedCard.player) {
                const reconstructedCard = this.reconstructCards([
                  playedCard.card,
                ])[0];
                if (reconstructedCard) {
                  game.playedCards.push({
                    player: playedCard.player,
                    card: reconstructedCard,
                  });
                }
              }
            }
          }

          // Restore deck
          if (Array.isArray(backup.deck)) {
            game.deck = this.reconstructCards(backup.deck);
            console.log(`Deck restaurado com ${game.deck.length} cartas`);
          }

          // Restore trump card and suit
          if (backup.trumpCard && backup.trumpCard.isCard) {
            game.trumpCard = this.reconstructCards([backup.trumpCard])[0];
          }
          if (backup.trumpSuit) {
            game.trumpSuit = backup.trumpSuit;
          }

          // Restore game state properties
          if (typeof backup.started === "boolean") {
            game.started = backup.started;
          }
          if (typeof backup.gameNumber === "number") {
            game.gameNumber = backup.gameNumber;
          }
          if (backup.marks && typeof backup.marks === "object") {
            game.marks = { ...backup.marks };
          }
          if (typeof backup.matchFinished === "boolean") {
            game.matchFinished = backup.matchFinished;
          }

          // Restore game flow after recovery
          setTimeout(async () => {
            if (
              game &&
              game.started &&
              !game.isGameFinished() &&
              !game.matchFinished &&
              game.currentTurn
            ) {
              try {
                // If it's a human player's turn, restart timer
                if (game.currentTurn !== game.bot) {
                  console.log(
                    `Reiniciando timer para ${game.currentTurn} após recovery`,
                  );
                  await gameHandlers.startPlayerTimer(
                    gameId,
                    game.currentTurn,
                    io,
                    game,
                    manager,
                  );
                }
                // If it's bot's turn, make bot play with confirmation
                else if (game.currentTurn === game.bot) {
                  console.log(`Bot jogando após recovery`);
                  await triggerBotPlayIfNeeded(game, io, gameId);
                }
              } catch (flowError) {
                console.warn(
                  `Erro ao restaurar fluxo do jogo:`,
                  flowError.message,
                );
              }
            }
          }, 1000);

          // Notify players about recovery
          safeEmitToRoom(io, gameId, "gameRecovered", {
            message: "Jogo recuperado após erro técnico",
            timestamp: new Date().toISOString(),
          });

          console.log(`✅ Jogo ${gameId} recuperado com sucesso`);
          return true;
        } catch (restoreError) {
          console.warn(`❌ Erro durante restauração:`, restoreError.message);
          return false;
        }
      }

      return false;
    } catch (recoveryError) {
      console.error(
        `Erro durante recuperação do jogo ${gameId}:`,
        recoveryError.message,
      );
      return false;
    }
  }

  // Create fallback bot play when bot handler fails
  createFallbackBotPlay(game, io, gameId) {
    try {
      // Clear any bot response timers since we're doing fallback
      clearBotResponseTimer(gameId);

      const botHand = game.hands[game.bot];
      if (!botHand || botHand.length === 0) {
        return { success: false, error: "Bot sem cartas válidas" };
      }

      // Play first available card as fallback
      const botCard = botHand[0];
      botHand.splice(0, 1);

      game.playedCards.push({ player: game.bot, card: botCard });

      safeEmitToRoom(io, gameId, "cardPlayed", {
        player: game.bot,
        card: botCard.getFace(),
        remainingCards: botHand.length,
        fallbackPlay: true,
      });

      safeEmitToRoom(io, gameId, "gameWarning", {
        message: "Bot fez jogada de emergência devido a erro técnico",
      });

      return { success: true, botCard, fallback: true };
    } catch (error) {
      return { success: false, error: "Falha completa do bot" };
    }
  }

  // Safe fallback for round resolution
  safeFallbackRoundResolution(
    game,
    card1,
    card2,
    player1,
    player2,
    io,
    gameId,
  ) {
    try {
      // Simple resolution: first card wins (fallback logic)
      const winner = player1;
      const loser = player2;

      // Clear played cards
      game.playedCards = [];
      game.currentTurn = winner;

      // Award minimal points to continue game
      if (!game.points[winner]) game.points[winner] = 0;
      game.points[winner] += 1;

      safeEmitToRoom(io, gameId, "roundEnd", {
        winner,
        points: game.points,
        fallbackResolution: true,
        message: "Rodada resolvida com lógica de emergência",
      });

      return { success: true, winner, fallback: true };
    } catch (error) {
      return { success: false, error: "Falha na resolução de emergência" };
    }
  }

  // Safe auto-play for timeouts
  safeAutoPlay(game, playerName, io, gameId) {
    try {
      const playerHand = game.hands[playerName];
      if (!playerHand || playerHand.length === 0) {
        return { success: false, error: "Jogador sem cartas" };
      }

      // Play first available card
      const autoCard = playerHand[0];
      playerHand.splice(0, 1);

      game.playedCards.push({ player: playerName, card: autoCard });

      safeEmitToRoom(io, gameId, "cardPlayed", {
        player: playerName,
        card: autoCard.getFace(),
        remainingCards: playerHand.length,
        autoPlay: true,
        reason: "timeout",
      });

      return { success: true, autoPlayedCard: autoCard };
    } catch (error) {
      return { success: false, error: "Falha no auto-play" };
    }
  }

  // Force cleanup when game end fails
  forceGameCleanup(gameId, manager, io) {
    try {
      // Remove game from manager
      if (manager && manager.activeGames) {
        manager.activeGames.delete(gameId);
      }

      // Clear any timers
      gameHandlers.clearPlayerTimer(gameId);

      // Remove backup state
      this.gameStates.delete(gameId);

      // Notify remaining players
      safeEmitToRoom(io, gameId, "gameForceEnded", {
        message: "Jogo encerrado devido a erro técnico",
        timestamp: new Date().toISOString(),
      });

      console.log(`Limpeza forçada concluída para o jogo ${gameId}`);
      return { success: true, forceCleanup: true };
    } catch (error) {
      console.error(
        `Erro na limpeza forçada do jogo ${gameId}:`,
        error.message,
      );
      return { success: false, error: "Falha na limpeza" };
    }
  }

  // Recover multiplayer game
  recoverMultiplayerGame(gameId, game, io, error) {
    try {
      // Notify all players about the recovery
      safeEmitToRoom(io, gameId, "multiplayerRecovery", {
        message: "Recuperando jogo multiplayer após erro...",
        timestamp: new Date().toISOString(),
      });

      // Attempt to restore from backup
      const recovered = this.recoverGameFromError(
        gameId,
        game,
        io,
        error,
        null,
      );

      if (recovered) {
        safeEmitToRoom(io, gameId, "gameStateUpdate", {
          state: game.getState(),
          recovered: true,
        });
      }

      return recovered;
    } catch (recoveryError) {
      console.error(
        `Erro na recuperação multiplayer do jogo ${gameId}:`,
        recoveryError.message,
      );
      return false;
    }
  }

  // Get recovery statistics
  getRecoveryStats() {
    return {
      activeRecoveries: this.activeRecoveries.size,
      backedUpGames: this.gameStates.size,
      errorHandler: errorHandler.getErrorStats(),
      socketProtection: socketProtection.getProtectionStats(),
    };
  }

  // Clean up old backups
  cleanupOldBackups() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [gameId, backup] of this.gameStates.entries()) {
      if (now - backup.timestamp > maxAge) {
        this.gameStates.delete(gameId);
      }
    }
  }
}

// Create singleton instance
const protectedHandlers = new ProtectedHandlers();

// Setup periodic cleanup
setInterval(() => {
  protectedHandlers.cleanupOldBackups();
}, 60000); // Clean up every minute

export default protectedHandlers;

// Export specific handler groups
export const protectedGameHandlers =
  protectedHandlers.createProtectedGameHandlers();
export const protectedMultiplayerHandlers =
  protectedHandlers.createProtectedMultiplayerHandlers();
export const protectedConnectionHandlers =
  protectedHandlers.createProtectedConnectionHandlers();
