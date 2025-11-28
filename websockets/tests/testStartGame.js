// Test script for game startup functionality
import { Game } from "../core/GameClass.js";

const game = new Game({
  players: ["Alice", "Bob"],
  bots: 2,
  turnTime: 5, // Turn time in seconds
});

console.log("=== GAME START ===");
console.log(game.start());

// Test manual card play after 3 seconds
setTimeout(() => {
  console.log("\n=== TEST: Manual card play ===");
  const player = "Alice";
  const card = game.hands[player][0];
  game.playCard(player, card);
}, 3000);
