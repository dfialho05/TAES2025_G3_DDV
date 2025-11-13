// Game class that manages the state and logic of a card game
import { Card, suits } from "./CardClass.js";
import { validateCardPlay } from "./gameRules.js";

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
    this.bot = players.length === 2 ? null : "Bot"; // Only creates bot if there is 1 player
    this.cardsPerPlayer = cardsPerPlayer;
    this.turnTime = turnTime * 1000; // Convert to milliseconds
    this.deck = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.hands = {};
    this.points = {};
    this.marks = {}; // Match scoring system (risca/moca)
    this.playedCards = [];
    this.currentTurn = null;
    this.timer = null;
    this.started = false;
    this.lastGameWinner = null;
    this.gameNumber = 1; // Track current game in match
    this.matchFinished = false;
  }

  // Creates a complete deck of cards with all suits and values
  createDeck = () => {
    const deck = [];
    suits.forEach((suit) => {
      Object.keys(cardValues).forEach((value) => {
        deck.push(new Card(suit, parseInt(value)));
      });
    });
    return deck;
  };

  // Shuffles the deck using Fisher-Yates algorithm
  shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  // Starts the game by creating and shuffling deck, dealing cards, and setting initial state
  start = () => {
    this.deck = this.shuffle(this.createDeck());
    this.trumpCard = this.deck[this.deck.length - 1];
    this.trumpSuit = this.trumpCard.getSuit();

    // Deal cards only to the two players
    const [p1, p2] =
      this.players.length === 2 ? this.players : [this.players[0], this.bot];
    this.hands[p1] = this.deck.splice(0, this.cardsPerPlayer);
    this.hands[p2] = this.deck.splice(0, this.cardsPerPlayer);

    this.points[p1] = 0;
    this.points[p2] = 0;

    // Initialize match scoring if not already done
    if (this.marks[p1] === undefined) this.marks[p1] = 0;
    if (this.marks[p2] === undefined) this.marks[p2] = 0;

    // First player of the new game is the winner of the last finished game when available
    const firstPlayer =
      this.lastGameWinner && [p1, p2].includes(this.lastGameWinner)
        ? this.lastGameWinner
        : p1;

    this.currentTurn = firstPlayer;
    this.started = true;
    this.startTimer();

    return this.getState();
  };

  // Returns the current game state with hands, trump, and turn information
  getState = () => {
    return {
      trump: `${this.trumpSuit} - ${this.trumpCard.getFace()}`,
      hands: Object.fromEntries(
        Object.entries(this.hands).map(([p, cards]) => [
          p,
          cards.map((c) => c.getFace()),
        ]),
      ),
      remaining: this.deck.length,
      currentTurn: this.currentTurn,
      points: { ...this.points },
      marks: { ...this.marks },
      gameNumber: this.gameNumber,
      matchFinished: this.matchFinished,
    };
  };

  // Starts or restarts the turn timer
  startTimer = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      console.log(`Tempo esgotado para ${this.currentTurn}!`);
      this.nextTurn();
    }, this.turnTime);
  };

  // Switches to the next player's turn
  nextTurn = () => {
    const [p1, p2] =
      this.players.length === 2 ? this.players : [this.players[0], this.bot];
    this.currentTurn = this.currentTurn === p1 ? p2 : p1;
    console.log(`Vez de ${this.currentTurn}`);
    this.startTimer();
  };

  // Handles a player playing a card
  playCard = (player, card) => {
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
  };

  // Determines the winner of current game and calculates marks
  determineWinner = () => {
    const [p1, p2] =
      this.players.length === 2 ? this.players : [this.players[0], this.bot];
    const p1Points = this.points[p1] || 0;
    const p2Points = this.points[p2] || 0;

    let winner = null;
    let marks = 0;

    if (p1Points >= 61) {
      winner = p1;
      if (p1Points === 120) {
        marks = 3; // Bandeira (clean sweep)
      } else if (p1Points >= 91) {
        marks = 2; // Capote
      } else {
        marks = 1; // Risca/Moca
      }
    } else if (p2Points >= 61) {
      winner = p2;
      if (p2Points === 120) {
        marks = 3; // Bandeira (clean sweep)
      } else if (p2Points >= 91) {
        marks = 2; // Capote
      } else {
        marks = 1; // Risca/Moca
      }
    }

    // Add marks to winner
    if (winner && marks > 0) {
      this.marks[winner] = (this.marks[winner] || 0) + marks;

      // Check if match is finished (first to 4 marks)
      if (this.marks[winner] >= 4) {
        this.matchFinished = true;
      }
    }

    // Remember who won this game so they start the next one
    if (winner) {
      this.lastGameWinner = winner;
    }

    console.log(
      `Jogo ${this.gameNumber} - Vencedor: ${winner || "Empate"} com ${winner ? this.points[winner] : 0} pontos! Marks: ${marks}`,
    );

    return {
      winner,
      points: winner ? this.points[winner] : 0,
      marks,
      matchMarks: { ...this.marks },
      matchFinished: this.matchFinished,
    };
  };

  // Returns count information for each suit based on played cards
  getSuitsCounts = () => {
    const suits = ["c", "e", "o", "p"];
    return suits.map((suit) => ({
      suit: suit,
      knownInGame: this.playedCards
        .map((play) => play.card)
        .filter((card) => card.getSuit() === suit).length,
      ranks: this.playedCards
        .map((play) => play.card)
        .filter((card) => card.getSuit() === suit)
        .map((card) => card.getRank()),
    }));
  };

  // Checks if the current game is finished (all cards played)
  isGameFinished = () => {
    // Game ends only when all cards are played
    return Object.values(this.hands).every((hand) => hand.length === 0);
  };

  // Gets the current leader based on points in this game
  getCurrentWinner = () => {
    const sorted = Object.entries(this.points).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  };

  // Gets the match leader based on marks
  getMatchLeader = () => {
    const sorted = Object.entries(this.marks).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  };

  // Starts a new game in the match (resets cards but keeps marks)
  startNewGame = () => {
    if (this.matchFinished) {
      throw new Error("A partida já terminou!");
    }

    this.gameNumber++;
    this.deck = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.hands = {};
    this.points = {};
    this.playedCards = [];
    this.currentTurn = null;
    this.timer = null;
    this.started = false;

    // Start the new game
    return this.start();
  };

  // Checks if match is finished (someone has 4+ marks)
  isMatchFinished = () => {
    return (
      this.matchFinished ||
      Object.values(this.marks).some((marks) => marks >= 4)
    );
  };

  // Adds points to a player's score
  addPoints = (player, points) => {
    if (this.points[player] !== undefined) {
      this.points[player] += points;
    }
  };

  // Clears the played cards array
  clearPlayedCards = () => {
    this.playedCards = [];
  };

  // Deals a card from the deck if available
  dealCard = () => {
    if (this.deck.length > 0) {
      return this.deck.pop();
    }
    return null;
  };

  // Checks if a player can play a specific card
  canPlayCard = (player, cardFace) => {
    const hand = this.hands[player];
    if (!hand) return false;

    return hand.some((card) => card.getFace() === cardFace);
  };

  // Validates if a card play is legal according to game rules
  validatePlay = (player, cardFace, leadCard = null) => {
    if (!this.canPlayCard(player, cardFace)) {
      return { valid: false, reason: "Carta não encontrada na mão" };
    }

    const playerCard = this.hands[player].find(
      (card) => card.getFace() === cardFace,
    );

    // Validate the card play using game rules
    const validation = validateCardPlay(
      this.deck,
      this.trumpSuit,
      leadCard,
      this.hands[player],
      playerCard,
    );

    if (!validation.valid) {
      return { valid: false, reason: validation.reason };
    }

    return { valid: true };
  };
}

export { Game };
