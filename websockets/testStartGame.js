import { Game } from "./GameClass.js";

const game = new Game({
  players: ["Alice", "Bob"],
  bots: 2,
  turnTime: 5, // segundos
});

console.log("=== INÍCIO DO JOGO ===");
console.log(game.start());

setTimeout(() => {
  console.log("\n=== TESTE: Jogada manual ===");
  const player = "Alice";
  const card = game.hands[player][0];
  game.playCard(player, card);
}, 3000);
