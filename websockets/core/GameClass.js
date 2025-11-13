import { Card, suits } from "./CardClass.js";

const cardValues = {
  2: { order: 1, points: 0 },
  3: { order: 2, points: 0 },
  4: { order: 3, points: 0 },
  5: { order: 4, points: 0 },
  6: { order: 5, points: 0 },
  12: { order: 6, points: 2 },
  11: { order: 7, points: 3 },
  13: { order: 8, points: 4 },
  7: { order: 9, points: 10 },
  1: { order: 10, points: 11 },
};

class Game {
  constructor({ players = [], cardsPerPlayer = 9, turnTime = 30 }) {
    if (players.length > 2) throw new Error("A partida é sempre 1 vs 1");
    this.players = players.length ? players : ["Player1"];
    this.bot = players.length === 2 ? null : "Bot"; // só cria bot se houver 1 jogador
    this.cardsPerPlayer = cardsPerPlayer;
    this.turnTime = turnTime * 1000; // milissegundos
    this.deck = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.hands = {};
    this.points = {};
    this.playedCards = [];
    this.currentTurn = null;
    this.timer = null;
    this.started = false;
  }

  createDeck() {
    const deck = [];
    suits.forEach((suit) => {
      Object.keys(cardValues).forEach((value) => {
        deck.push(new Card(suit, parseInt(value)));
      });
    });
    return deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  start() {
    this.deck = this.shuffle(this.createDeck());
    this.trumpCard = this.deck[this.deck.length - 1];
    this.trumpSuit = this.trumpCard.getSuit();

    // Distribuir cartas apenas para os dois jogadores
    const [p1, p2] = this.players.length === 2 ? this.players : [this.players[0], this.bot];
    this.hands[p1] = this.deck.splice(0, this.cardsPerPlayer);
    this.hands[p2] = this.deck.splice(0, this.cardsPerPlayer);

    this.points[p1] = 0;
    this.points[p2] = 0;

    this.currentTurn = p1;
    this.started = true;
    this.startTimer();

    return this.getState();
  }

  getState() {
    return {
      trump: `${this.trumpSuit} - ${this.trumpCard.getFace()}`,
      hands: Object.fromEntries(
        Object.entries(this.hands).map(([p, cards]) => [
          p,
          cards.map((c) => c.getFace()),
        ])
      ),
      remaining: this.deck.length,
      currentTurn: this.currentTurn,
    };
  }

  startTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      console.log(`Tempo esgotado para ${this.currentTurn}!`);
      this.nextTurn();
    }, this.turnTime);
  }

  nextTurn() {
    const [p1, p2] = this.players.length === 2 ? this.players : [this.players[0], this.bot];
    this.currentTurn = this.currentTurn === p1 ? p2 : p1;
    console.log(`Vez de ${this.currentTurn}`);
    this.startTimer();
  }

  playCard(player, card) {
    if (player !== this.currentTurn) {
      console.log(`Não é a vez de ${player}!`);
      return;
    }
    const hand = this.hands[player];
    const cardIndex = hand.findIndex((c) => c.getFace() === card.getFace());
    if (cardIndex === -1) {
      console.log(`${player} não tem essa carta!`);
      return;
    }

    const played = hand.splice(cardIndex, 1)[0];
    this.playedCards.push({ player, card: played });
    console.log(`${player} jogou ${played.getFace()}`);

    this.nextTurn();
  }

  determineWinner() {
    const sorted = Object.entries(this.points).sort((a, b) => b[1] - a[1]);
    const [winner, points] = sorted[0];
    console.log(`Vencedor: ${winner} com ${points} pontos!`);
    return { winner, points };
  }
}

export { Game };
