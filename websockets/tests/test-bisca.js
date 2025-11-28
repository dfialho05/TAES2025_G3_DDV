// Test script for Bisca game logic
import { Game } from "./core/GameClass.js";
import { Card } from "./core/CardClass.js";
import { selectPlayWinner } from "./core/gameRules.js";

console.log("Testando lógica do jogo Bisca...\n");

// Test 1: Card Values
console.log("=== Teste 1: Valores das Cartas ===");
const ace = new Card("c", 1);
const seven = new Card("e", 7);
const king = new Card("o", 13);
const jack = new Card("p", 11);
const queen = new Card("c", 12);
const two = new Card("e", 2);

console.log(`Ás de Copas: ${ace.getValue()} pontos (esperado: 11)`);
console.log(`Sete de Espadas: ${seven.getValue()} pontos (esperado: 10)`);
console.log(`Rei de Ouros: ${king.getValue()} pontos (esperado: 4)`);
console.log(`Valete de Paus: ${jack.getValue()} pontos (esperado: 3)`);
console.log(`Dama de Copas: ${queen.getValue()} pontos (esperado: 2)`);
console.log(`Dois de Espadas: ${two.getValue()} pontos (esperado: 0)`);

// Test 2: Game Creation and Match System
console.log("\n=== Teste 2: Sistema de Partida ===");
const game = new Game({ players: ["Jogador1"], turnTime: 30 });
const initialState = game.start();

console.log(`Jogo iniciado - Número: ${game.gameNumber}`);
console.log(`Trunfo: ${game.trumpSuit}`);
console.log(`Marcas iniciais: ${JSON.stringify(game.marks)}`);
console.log(`Cartas na mão do Jogador1: ${game.hands["Jogador1"].length}`);
console.log(`Cartas na mão do Bot: ${game.hands["Bot"].length}`);

// Test 3: Trump Card Logic
console.log("\n=== Teste 3: Lógica de Trunfo ===");
const trumpCard = new Card("c", 2); // 2 de Copas (trunfo)
const nonTrumpCard = new Card("e", 1); // Ás de Espadas (não-trunfo)

const trumpResult = selectPlayWinner(trumpCard, nonTrumpCard, "c");
console.log(
  `Trunfo (2C) vs Ás não-trunfo (AE): Vencedor ${trumpResult.winner} (esperado: 1 - trunfo vence)`,
);

const aceResult = selectPlayWinner(nonTrumpCard, trumpCard, "c");
console.log(
  `Ás não-trunfo (AE) vs Trunfo (2C): Vencedor ${aceResult.winner} (esperado: 2 - trunfo vence)`,
);

// Test 4: Same Suit Comparison
console.log("\n=== Teste 4: Comparação Mesmo Naipe ===");
const aceSpades = new Card("e", 1); // Ás de Espadas
const kingSpades = new Card("e", 13); // Rei de Espadas

const sameSuitResult = selectPlayWinner(aceSpades, kingSpades, "c");
console.log(
  `ÁsE vs ReiE: Vencedor ${sameSuitResult.winner} (esperado: 1 - Ás tem rank maior)`,
);

// Test 5: Match Scoring System
console.log("\n=== Teste 5: Sistema de Pontuação ===");

// Simulate a game with 61 points
game.points["Jogador1"] = 61;
game.points["Bot"] = 59;
let result = game.determineWinner();
console.log(
  `61 vs 59 pontos: Vencedor ${result.winner}, Marcas: ${result.marks} (esperado: 1 marca)`,
);

// Simulate a game with 95 points
game.points["Jogador1"] = 95;
game.points["Bot"] = 25;
result = game.determineWinner();
console.log(
  `95 vs 25 pontos: Vencedor ${result.winner}, Marcas: ${result.marks} (esperado: 2 marcas - Capote)`,
);

// Simulate a game with 120 points
game.points["Jogador1"] = 120;
game.points["Bot"] = 0;
result = game.determineWinner();
console.log(
  `120 vs 0 pontos: Vencedor ${result.winner}, Marcas: ${result.marks} (esperado: 3 marcas - Bandeira)`,
);

// Test 6: Match Continuation
console.log("\n=== Teste 6: Continuação da Partida ===");
console.log(`Marcas atuais: ${JSON.stringify(game.marks)}`);
console.log(`Partida terminada? ${game.isMatchFinished()}`);

// Add marks to see match progression
game.marks["Jogador1"] = 3;
game.marks["Bot"] = 2;
console.log(`Após adicionar marcas: ${JSON.stringify(game.marks)}`);
console.log(`Partida terminada? ${game.isMatchFinished()}`);

game.marks["Jogador1"] = 4;
console.log(`Após Jogador1 chegar a 4 marcas: ${JSON.stringify(game.marks)}`);
console.log(`Partida terminada? ${game.isMatchFinished()} (esperado: true)`);

// Test 7: Deck and Card Dealing
console.log("\n=== Teste 7: Baralho e Distribuição ===");
const newGame = new Game({ players: ["Teste1", "Teste2"], turnTime: 30 });
newGame.start();

let totalCards = 0;
Object.values(newGame.hands).forEach((hand) => {
  totalCards += hand.length;
});
totalCards += newGame.deck.length;

console.log(`Total de cartas no jogo: ${totalCards} (esperado: 40)`);
console.log(`Cartas restantes no baralho: ${newGame.deck.length}`);
console.log(`Carta de trunfo: ${newGame.trumpCard.getFace()}`);

// Test 8: Card Validation
console.log("\n=== Teste 8: Validação de Jogadas ===");
const playerHand = newGame.hands["Teste1"];
const firstCard = playerHand[0];

// Valid play (player has the card)
const validation1 = newGame.validatePlay("Teste1", firstCard.getFace(), null);
console.log(
  `Jogada válida (carta na mão): ${validation1.valid} (esperado: true)`,
);

// Invalid play (player doesn't have the card)
const fakeCard = new Card("c", 1);
const validation2 = newGame.validatePlay("Teste1", fakeCard.getFace(), null);
console.log(
  `Jogada inválida (carta não na mão): ${validation2.valid} (esperado: false)`,
);

// Test 9: Game Flow Simulation
console.log("\n=== Teste 9: Simulação de Fluxo de Jogo ===");
const flowGame = new Game({ players: ["Alice", "Bob"], turnTime: 30 });
flowGame.start();

console.log(`Turno inicial: ${flowGame.currentTurn}`);
console.log(`Jogo iniciado: ${flowGame.started}`);
console.log(`Jogo terminado: ${flowGame.isGameFinished()}`);

// Simulate playing all cards
let rounds = 0;
while (!flowGame.isGameFinished() && rounds < 20) {
  // Safety limit
  const currentPlayer = flowGame.currentTurn;
  const hand = flowGame.hands[currentPlayer];

  if (hand && hand.length > 0) {
    const card = hand[0];
    flowGame.playCard(currentPlayer, card);
    rounds++;
  } else {
    break;
  }
}

console.log(`Rondas simuladas: ${rounds}`);
console.log(`Jogo terminado após simulação: ${flowGame.isGameFinished()}`);

console.log("\nTodos os testes de Bisca concluídos!");
