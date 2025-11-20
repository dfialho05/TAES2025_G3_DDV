/**
 * Bisca game state and logic
 *
 * This module implements the core game state management for a two-player
 * Bisca game (supports "Bisca de 3" and "Bisca de 9" variants) and exposes
 * the functions used by the WebSocket event handlers.
 *
 * It relies on the helper modules in ../core:
 *  - cardClass.js    -> exports Card, suits
 *  - gameRules.js    -> exports selectPlayWinner, doAPlay, validateCardPlay
 *  - bot.js          -> exports botPlay
 *
 * Public API (exports):
 *  - createGame(difficultyOrHandSize, user) : create and return a new game
 *  - getGames()                              : return an array of all games
 *  - joinGame(gameID, player2)               : set player2 for a game
 *  - flipCard(gameID, card, playerID)        : play a card (keeps name from template)
 *  - clearFlippedCard(game)                  : helper to clear pending/trick state (keeps name)
 *  - getGame(gameID)                         : return a single game
 *  - resignGame(gameID, playerID)            : handle resignation
 *
 * Notes:
 *  - The existing template called the play event "flip-card" and used flipCard(...)
 *    so we keep that name but make it execute Bisca card plays.
 *  - The module tries to be defensive about incoming card payloads (accepts objects
 *    with `face`, or `{ suit, cardFigure }`, or `{ suit, value }`).
 */

import { Card, suits } from "../core/cardClass.js";
import {
  selectPlayWinner,
  doAPlay,
  validateCardPlay,
} from "../core/gameRules.js";
import { botPlay } from "../core/bot.js";

// Internal storage
const games = new Map();
let currentGameID = 0;

// Card figures used by the Card constructor (Bisca uses a 40-card deck)
const cardFigures = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13]; // 1=Ás, 7=Sete, 11=Valete, 12=Dama, 13=Rei

// Utility: create and shuffle a deck
const generateDeck = () => {
  const deck = [];
  for (const suit of suits) {
    for (const fig of cardFigures) {
      deck.push(new Card(suit, fig));
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// Utility: parse incoming card payload into a Card instance (without altering player's hand)
const normalizeCardPayload = (payload) => {
  if (!payload) return null;

  // If it's already an instance of Card, return it
  if (payload instanceof Card) return payload;

  // payload.face format expected like 'c1' or 'p13'
  if (typeof payload.face === "string") {
    const suit = payload.face[0];
    const figure = parseInt(payload.face.slice(1), 10);
    return new Card(suit, figure);
  }

  // payload may be { suit, cardFigure } or { suit, value }
  const suit = payload.suit || payload.naipe || payload.s;
  const figure =
    payload.cardFigure || payload.value || payload.figure || payload.f;
  if (suit && typeof figure === "number") {
    return new Card(suit, figure);
  }

  // last attempt: accept { suit, rank } where rank maps to figure
  const altFigure = payload.rank;
  if (suit && typeof altFigure === "number") {
    return new Card(suit, altFigure);
  }

  // Unknown format
  return null;
};

// Utility: compute points in an array of Card instances
const computePoints = (cards) => {
  if (!cards || cards.length === 0) return 0;
  return cards.reduce(
    (acc, c) => acc + (typeof c.getValue === "function" ? c.getValue() : 0),
    0,
  );
};

// Create a new game
// signature kept to match existing socket handler: createGame(difficulty, user)
// We use the "difficulty" parameter to represent hand size: 3 or 9 (default 3)
export const createGame = (difficultyOrHandSize, user) => {
  const handSize = [3, 9].includes(difficultyOrHandSize)
    ? difficultyOrHandSize
    : 3;

  currentGameID++;
  const deck = generateDeck();
  const trumpCard = deck[deck.length - 1];
  const trumpSuit = trumpCard.getSuit();

  const game = {
    id: currentGameID,
    creator: user.id,
    player1: user.id,
    player2: null,
    player1Name: user.name || null,
    player2Name: null,
    winner: null,
    started: false,
    complete: false,
    beganAt: null,
    endedAt: null,
    handSize, // 3 or 9
    deck, // remaining draw pile (Card instances)
    trumpSuit,
    trumpCard,
    player1Hand: [],
    player2Hand: [],
    player1Collected: [],
    player2Collected: [],
    player1Score: 0,
    player2Score: 0,
    currentPlayer: user.id, // who must play next (player id)
    leadCard: null, // Card instance of the current trick's lead
    playedCards: [], // [{player: id, card: Card}]
    moves: 0,
    resignations: {}, // map playerID -> boolean
    lastActionAt: null,
    // timers, retries etc can be added later
  };

  // initial deal (alternate: p1 then p2) until each has handSize
  for (let i = 0; i < handSize; i++) {
    // player1 draw
    if (game.deck.length > 0) {
      game.player1Hand.push(game.deck.shift());
    }
    // player2 draw (player2 may be null for now; if later joined and we want fairness we could re-deal)
    if (game.deck.length > 0) {
      game.player2Hand.push(game.deck.shift());
    }
  }

  games.set(currentGameID, game);
  return game;
};

// Return array of games (serialized as simple objects to avoid class methods in payloads)
export const getGames = () => {
  const arr = [];
  for (const g of games.values()) {
    arr.push(serializeGameSummary(g));
  }
  return arr;
};

const serializeGameSummary = (g) => ({
  id: g.id,
  creator: g.creator,
  player1: g.player1,
  player1Name: g.player1Name,
  player2: g.player2,
  player2Name: g.player2Name,
  started: g.started,
  complete: g.complete,
  handSize: g.handSize,
  trumpSuit: g.trumpSuit,
  moves: g.moves,
  winner: g.winner,
});

// Join a game: set player2
export const joinGame = (gameID, player2) => {
  const game = games.get(gameID);
  if (!game) return null;
  game.player2 = player2;
  game.player2Name = typeof player2 === "string" ? player2 : null;
  return game;
};

// Get a single game by id
export const getGame = (gameID) => {
  return games.get(gameID);
};

// Clear "flipped" style state - kept name for compatibility with template
export const clearFlippedCard = (game) => {
  // In Bisca context, clear any temporary non-final trick state:
  // This function will be used by the template to clear a failed flip animation,
  // but we repurpose it to ensure playedCards are cleared only when appropriate.
  if (!game) return null;

  // If there are two played cards but nothing resolved (edge case), remove them and pass turn
  if (game.playedCards && game.playedCards.length === 2 && !game.leadCard) {
    game.playedCards = [];
  }

  return game;
};

// Internal helper: find and remove a Card instance from a player's hand matching face
const removeCardFromHand = (hand, cardToRemove) => {
  if (!hand || hand.length === 0) return null;

  // Try to find by face (suit + figure) using Card.getFace()
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    if (c.getFace() === cardToRemove.getFace()) {
      hand.splice(i, 1);
      return c;
    }
  }

  // fallback: match by suit and rank
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    if (
      c.getSuit() === cardToRemove.getSuit() &&
      c.getRank() === cardToRemove.getRank()
    ) {
      hand.splice(i, 1);
      return c;
    }
  }

  return null;
};

// Resolve the current trick when both players have played
const resolveTrick = (game) => {
  if (!game || !game.playedCards || game.playedCards.length < 2) return;

  const firstPlay = game.playedCards[0];
  const secondPlay = game.playedCards[1];

  const card1 = firstPlay.card;
  const card2 = secondPlay.card;

  // Use doAPlay / selectPlayWinner from gameRules
  let result;
  try {
    result = doAPlay(
      game.deck,
      game.trumpSuit,
      card1, // player1Card
      // we need second player's hand to validate but doAPlay expects player2Hand param earlier
      [],
      card2,
    );
  } catch (err) {
    // fallback: use simple winner selection
    result = selectPlayWinner(card1, card2, game.trumpSuit);
  }

  const winnerIndex = result.winner === 1 ? 1 : 2;
  const winnerPlayerID =
    winnerIndex === 1 ? firstPlay.player : secondPlay.player;

  // Give both cards to winner's collected pile
  if (winnerPlayerID === game.player1) {
    game.player1Collected.push(card1, card2);
  } else {
    game.player2Collected.push(card1, card2);
  }

  // After trick, draw cards: winner draws top of deck then loser draws top (if any)
  const loserPlayerID =
    winnerPlayerID === game.player1 ? game.player2 : game.player1;

  if (game.deck.length > 0) {
    const drawn = game.deck.shift();
    if (winnerPlayerID === game.player1) game.player1Hand.push(drawn);
    else game.player2Hand.push(drawn);
  }
  if (game.deck.length > 0) {
    const drawn = game.deck.shift();
    if (loserPlayerID === game.player1) game.player1Hand.push(drawn);
    else game.player2Hand.push(drawn);
  }

  // Update currentPlayer to trick winner
  game.currentPlayer = winnerPlayerID;
  game.leadCard = null;
  game.playedCards = [];
  game.moves++;

  // Check end of game
  checkForGameComplete(game);

  return {
    winner: winnerPlayerID,
    winningCard: result.winner === 1 ? card1 : card2,
  };
};

// Check for game completion and score calculation
const checkForGameComplete = (game) => {
  if (!game) return;

  // Game ends when both hands empty and deck empty
  const p1Empty = game.player1Hand.length === 0;
  const p2Empty = game.player2Hand.length === 0;
  const deckEmpty = game.deck.length === 0;

  if (p1Empty && p2Empty && deckEmpty) {
    game.complete = true;
    game.endedAt = new Date();

    // Compute scores
    game.player1Score = computePoints(game.player1Collected);
    game.player2Score = computePoints(game.player2Collected);

    if (game.player1Score >= 61 && game.player1Score > game.player2Score) {
      game.winner = game.player1;
    } else if (
      game.player2Score >= 61 &&
      game.player2Score > game.player1Score
    ) {
      game.winner = game.player2;
    } else {
      // Highest points wins when both played out
      if (game.player1Score > game.player2Score) game.winner = game.player1;
      else if (game.player2Score > game.player1Score)
        game.winner = game.player2;
      else game.winner = "draw";
    }
  }
};

// Main play function (keeps name `flipCard` to match template events)
// `playerID` should be provided to validate turn ownership.
// `cardPayload` is expected from client and will be normalized.
export const flipCard = (gameID, cardPayload, playerID) => {
  const game = games.get(gameID);
  if (!game) return null;

  // If the game hasn't started and both players present, mark started
  if (!game.started && game.player1 && game.player2) {
    game.started = true;
    game.beganAt = new Date();
  }

  // If game complete, ignore plays
  if (game.complete) return game;

  // Validate current player
  if (playerID !== game.currentPlayer) {
    // Not this player's turn
    return game;
  }

  // Normalize card
  const card = normalizeCardPayload(cardPayload);
  if (!card) return game;

  // Determine player's hand reference
  const playerHand =
    playerID === game.player1 ? game.player1Hand : game.player2Hand;

  // Ensure the card is in player's hand
  const actualCardInstance = playerHand.find(
    (c) =>
      c.getFace() === card.getFace() ||
      (c.getSuit() === card.getSuit() && c.getRank() === card.getRank()),
  );
  if (!actualCardInstance) {
    // Card not found in player's hand - ignore
    return game;
  }

  // Validate play according to rules
  const validation = validateCardPlay(
    game.deck,
    game.trumpSuit,
    game.leadCard,
    playerHand,
    actualCardInstance,
  );
  if (!validation.valid) {
    // invalid move - ignore (frontend should handle)
    return { ...game, invalidMoveReason: validation.reason || "Invalid play" };
  }

  // Remove card from player's hand and register play
  const removedCard = removeCardFromHand(playerHand, actualCardInstance);
  if (!removedCard) {
    return game;
  }

  game.playedCards.push({ player: playerID, card: removedCard });

  // If this is the first play of the trick, set leadCard and switch currentPlayer to opponent
  if (!game.leadCard) {
    game.leadCard = removedCard;
    // set currentPlayer to opponent
    game.currentPlayer =
      playerID === game.player1 ? game.player2 : game.player1;
    game.lastActionAt = new Date();

    // If opponent is a bot, trigger bot response immediately
    if (isBotPlayer(game, game.currentPlayer)) {
      processBotResponse(game);
    }

    return game;
  }

  // If this is second play of trick, resolve trick
  if (game.playedCards.length === 2) {
    const resolution = resolveTrick(game);
    game.lastActionAt = new Date();

    // After resolution, if opponent is bot and it's bot's turn to play next (i.e., winner is bot and bot has cards), process bot lead
    if (
      game.started &&
      !game.complete &&
      isBotPlayer(game, game.currentPlayer)
    ) {
      processBotResponse(game);
    }

    return { ...game, trickResult: resolution || null };
  }

  return game;
};

// Determine if the given player id corresponds to a bot placeholder
const isBotPlayer = (game, playerID) => {
  if (!game || !playerID) return false;
  // We consider player IDs that are strings 'bot' or object with isBot flag (flexible)
  if (playerID === "bot") return true;
  if (typeof playerID === "object" && playerID.isBot) return true;
  if (typeof playerID === "string" && playerID.startsWith("bot-")) return true;
  return false;
};

// Simple bot flow: let bot decide a card and play it into the game state
const processBotResponse = (game) => {
  if (!game) return;

  // Determine bot id
  const botID =
    game.player1 && isBotPlayer(game, game.player1)
      ? game.player1
      : game.player2;

  if (!botID) return;

  // Build bot hand reference
  const botHand = botID === game.player1 ? game.player1Hand : game.player2Hand;

  // If bot is to lead
  if (!game.leadCard) {
    const suitsCounts = suits.map((s) => ({
      suit: s,
      knownInGame: botHand.filter((c) => c.getSuit() === s).length,
      ranks: botHand.filter((c) => c.getSuit() === s).map((c) => c.getRank()),
    }));
    const assistNeeded = game.deck.length === 0;
    const chosen = botPlay(
      null,
      botHand,
      game.trumpSuit,
      assistNeeded,
      suitsCounts,
    );
    if (!chosen) return;
    // remove chosen from hand and register play
    removeCardFromHand(botHand, chosen);
    game.playedCards.push({ player: botID, card: chosen });
    game.leadCard = chosen;
    game.currentPlayer = botID === game.player1 ? game.player2 : game.player1;
    game.lastActionAt = new Date();

    return;
  }

  // If bot responds to a lead
  const leadCard = game.leadCard;
  const assistNeeded = game.deck.length === 0;
  const chosenResponse = botPlay(
    leadCard,
    botHand,
    game.trumpSuit,
    assistNeeded,
    null,
  );
  if (!chosenResponse) return;

  // remove chosen from hand and register play
  removeCardFromHand(botHand, chosenResponse);
  game.playedCards.push({ player: botID, card: chosenResponse });

  // Now resolve the trick
  resolveTrick(game);
  game.lastActionAt = new Date();

  // After resolution possibly trigger next bot move if bot keeps turn
  if (!game.complete && isBotPlayer(game, game.currentPlayer)) {
    // small recursion but fine for simple bot
    processBotResponse(game);
  }
};

// Handle resignation: award all remaining cards to opponent and finalize game
export const resignGame = (gameID, playerID) => {
  const game = games.get(gameID);
  if (!game || game.complete) return null;

  const opponent = playerID === game.player1 ? game.player2 : game.player1;

  // Give all remaining cards (hands + deck + playedCards) to opponent's collected pile
  const remaining = [
    ...game.deck,
    ...game.player1Hand,
    ...game.player2Hand,
    ...game.playedCards.map((p) => p.card),
  ];

  if (opponent === game.player1) {
    game.player1Collected.push(...remaining);
  } else {
    game.player2Collected.push(...remaining);
  }

  // Clear hands and deck
  game.deck = [];
  game.player1Hand = [];
  game.player2Hand = [];
  game.playedCards = [];
  game.leadCard = null;
  game.complete = true;
  game.endedAt = new Date();
  game.winner = opponent;

  // compute final scores
  game.player1Score = computePoints(game.player1Collected);
  game.player2Score = computePoints(game.player2Collected);

  return game;
};

// Export default minimal API for other modules that may import everything
export default {
  createGame,
  getGames,
  joinGame,
  flipCard,
  clearFlippedCard,
  getGame,
  resignGame,
};
