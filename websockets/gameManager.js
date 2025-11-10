import { Game } from "./GameClass.js";

class GameManager {
  constructor() {
    this.activeGames = new Map(); // gameId -> Game
    this.playerGames = new Map(); // playerName -> gameId
    this.gameIdCounter = 1;
  }

  // Cria um novo jogo 1vs1
  createGame(player1, player2 = null, turnTime = 30) {
    const gameId = `game-${this.gameIdCounter++}`;
    const players = player2 ? [player1, player2] : [player1]; // 1 jogador vs bot se player2 não existir
    const game = new Game({ players, turnTime });
    game.start();

    this.activeGames.set(gameId, game);
    this.playerGames.set(player1, gameId);
    if (player2) this.playerGames.set(player2, gameId);

    return { gameId, game };
  }

  // Obtém o jogo de um jogador
  getGameByPlayer(player) {
    const gameId = this.playerGames.get(player);
    if (!gameId) return null;
    return this.activeGames.get(gameId);
  }

  // Remove um jogo após terminar
  removeGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) return false;

    // remover jogadores do map
    Object.keys(game.hands).forEach((p) => this.playerGames.delete(p));
    this.activeGames.delete(gameId);
    return true;
  }

  // Lista todos os jogos ativos
  listActiveGames() {
    return Array.from(this.activeGames.keys());
  }
}

export { GameManager };
