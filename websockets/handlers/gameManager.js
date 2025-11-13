// Game manager class that handles creation and management of active games
import { Game } from "../core/GameClass.js";
import { Card } from "../core/CardClass.js";

class GameManager {
  constructor() {
    this.activeGames = new Map(); // Map of gameId -> Game instance
    this.playerGames = new Map(); // Map of playerName -> gameId
    this.gameIdCounter = 1; // Counter for generating unique game IDs
  }

  // Creates a new game instance and assigns it a unique ID
  createGame = (player1, player2 = null, turnTime = 30) => {
    const gameId = `game-${this.gameIdCounter++}`;
    const players = player2 ? [player1, player2] : [player1];
    const game = new Game({ players, turnTime });
    game.start();

    this.activeGames.set(gameId, game);
    this.playerGames.set(player1, gameId);
    if (player2) this.playerGames.set(player2, gameId);

    return { gameId, game };
  };

  // Retrieves the game instance for a given player
  getGameByPlayer = (player) => {
    const gameId = this.playerGames.get(player);
    if (!gameId) return null;
    return this.activeGames.get(gameId);
  };

  // Removes a game and cleans up player mappings
  removeGame = (gameId) => {
    const game = this.activeGames.get(gameId);
    if (!game) return false;

    // Remove player mappings for all players in the game
    Object.keys(game.hands).forEach((p) => this.playerGames.delete(p));
    this.activeGames.delete(gameId);
    return true;
  };

  // Returns an array of all active game IDs
  listActiveGames = () => {
    return Array.from(this.activeGames.keys());
  };
}

export { GameManager };
