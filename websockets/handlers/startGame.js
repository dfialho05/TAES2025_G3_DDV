// Simple game starter utility for testing purposes
import { Game } from "../core/GameClass.js";

// Creates and starts a new game with default players
export const startGame = () => {
  const game = new Game({
    players: ["Alice", "Bot1"],
    turnTime: 15,
  });

  return game.start();
};
