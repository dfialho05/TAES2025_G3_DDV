// Test script for game manager functionality
import { GameManager } from "../handlers/gameManager.js";

const manager = new GameManager();

// Create simultaneous games
const { gameId: g1 } = manager.createGame("Alice", "Bob");
const { gameId: g2 } = manager.createGame("Carol"); // Player vs bot
const { gameId: g3 } = manager.createGame("Dave"); // Player vs bot

console.log("Active games:", manager.listActiveGames());

// Player makes a move
const gameAlice = manager.getGameByPlayer("Alice");
const cardAlice = gameAlice.hands["Alice"][0];
gameAlice.playCard("Alice", cardAlice);

// Player vs bot game
const gameCarol = manager.getGameByPlayer("Carol");
const cardCarol = gameCarol.hands["Carol"][0];
gameCarol.playCard("Carol", cardCarol);
