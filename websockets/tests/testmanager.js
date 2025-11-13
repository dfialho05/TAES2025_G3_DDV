import { GameManager } from "./handlers/gameManager.js";

const manager = new GameManager();

// Criar jogos simultâneos
const { gameId: g1 } = manager.createGame("Alice", "Bob");
const { gameId: g2 } = manager.createGame("Carol"); // vs bot
const { gameId: g3 } = manager.createGame("Dave"); // vs bot

console.log("Jogos ativos:", manager.listActiveGames());

// Jogador faz uma jogada
const gameAlice = manager.getGameByPlayer("Alice");
const cardAlice = gameAlice.hands["Alice"][0];
gameAlice.playCard("Alice", cardAlice);

// Jogador vs bot
const gameCarol = manager.getGameByPlayer("Carol");
const cardCarol = gameCarol.hands["Carol"][0];
gameCarol.playCard("Carol", cardCarol);
