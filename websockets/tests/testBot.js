// Bot testing module that tests bot AI functionality and game logic
import { Card, suits } from "../core/CardClass.js";
import { selectPlayWinner } from "../core/gameRules.js";

// Define ranks locally since it's not exported from CardClass.js - using valid card values
const ranks = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

// Import bot functions directly to avoid singleplayer.js dependencies
// Counts cards by suit and tracks known cards in the game
const cardsAddCount = (cardPlayed, botHand) => {
  const suitCounts = suits.map((suit) => ({
    suit: suit,
    knownInGame: botHand.filter((card) => card.getSuit() === suit).length,
    ranks: botHand
      .filter((card) => card.getSuit() === suit)
      .map((card) => card.getRank()),
  }));

  // Add the played card to the count for its suit (excluding bot's own cards)
  const playedSuit = cardPlayed.getSuit();
  const playedRank = cardPlayed.getRank();
  const suitIndex = suitCounts.findIndex((count) => count.suit === playedSuit);
  if (suitIndex !== -1) {
    // Only count the played card if it's not from the bot's hand
    const isFromBotHand = botHand.some(
      (card) => card.getSuit() === playedSuit && card.getRank() === playedRank,
    );
    if (!isFromBotHand) {
      suitCounts[suitIndex].knownInGame += 1;
      suitCounts[suitIndex].ranks.push(playedRank);
    }
  }

  return suitCounts;
};

// Chooses the best card to lead when bot plays first
const chooseBestLead = (botHand, trump, assistNeeded, suitsCounts) => {
  // PRIORITY 1: Assist Needed - Play the highest card that can win based on known cards
  if (assistNeeded) {
    const winningCards = [];

    for (const card of botHand) {
      const cardSuit = card.getSuit();
      const cardRank = card.getRank();

      // Find suit counts for this card's suit
      const suitCount = suitsCounts.find((sc) => sc.suit === cardSuit);
      if (!suitCount) continue;

      // If it's a trump card
      if (cardSuit === trump) {
        // Check if there are any known trump cards with higher rank
        const higherTrumps = suitCount.ranks.filter((rank) => rank > cardRank);
        if (higherTrumps.length === 0) {
          // No known higher trumps, this card can likely win
          winningCards.push(card);
        }
      } else {
        // If it's not trump, check if it's the highest known card of its suit
        const higherSamesuit = suitCount.ranks.filter(
          (rank) => rank > cardRank,
        );
        if (higherSamesuit.length === 0) {
          // No known higher cards of same suit, but need to consider trump
          // This card can win if opponent doesn't have trump or higher same suit
          winningCards.push(card);
        }
      }
    }

    if (winningCards.length > 0) {
      // Among winning cards, choose the one with highest value (points)
      return winningCards.reduce((highest, card) =>
        card.getValue() > highest.getValue() ? card : highest,
      );
    }
  }
  // PRIORITY 2: Trys to lose giving the lowest possible points not trump
  const nonTrumpCards = botHand.filter((card) => card.getSuit() !== trump);
  if (nonTrumpCards.length > 0) {
    return nonTrumpCards.reduce((lowest, card) =>
      card.getRank() < lowest.getRank() ? card : lowest,
    );
  }

  // PRIORITY 3: Playes the highest trump card that have value = 0
  const zeroValueTrumpCards = botHand.filter(
    (card) => card.getSuit() === trump && card.getValue() === 0,
  );
  if (zeroValueTrumpCards.length > 0) {
    return zeroValueTrumpCards.reduce((highest, card) =>
      card.getRank() > highest.getRank() ? card : highest,
    );
  }

  // PRIORITY 4: Play the lowest card possible (This priority mith not ever be reached but it is for damage control)
  return botHand.reduce((lowest, card) =>
    card.getRank() < lowest.getRank() ? card : lowest,
  );
};

// Function to choose the best response to a played card
// Chooses the best response card when bot plays second
const chooseBestResponse = (cardPlayed, botHand, trump, assistNeeded) => {
  if (!botHand || botHand.length === 0) {
    throw new Error("Bot hand is empty");
  }

  const playedSuit = cardPlayed.getSuit();
  const playedRank = cardPlayed.getRank();
  const playedValue = cardPlayed.getValue();
  const isPlayedTrump = playedSuit === trump;

  // PRIORITY 1: Both trump cards - choose SMALLEST trump that wins
  if (isPlayedTrump) {
    const winningTrump = botHand.filter(
      (card) => card.getSuit() === trump && card.getRank() > playedRank,
    );
    if (winningTrump.length > 0) {
      return winningTrump.reduce((lowest, card) =>
        card.getRank() < lowest.getRank() ? card : lowest,
      );
    }
  }

  // PRIORITY 2: Win with same suit (higher rank) - choose highest winning rank
  if (!isPlayedTrump) {
    const winningSameSuit = botHand.filter(
      (card) => card.getSuit() === playedSuit && card.getRank() > playedRank,
    );
    if (winningSameSuit.length > 0) {
      return winningSameSuit.reduce((highest, card) =>
        card.getRank() > highest.getRank() ? card : highest,
      );
    }
  }

  // PRIORITY 3: AssistNeeded and can't win, choose lowest losing rank
  if (assistNeeded) {
    const cardssAvailable = botHand.filter(
      (card) => card.getSuit() === playedSuit,
    );
    if (cardssAvailable.length > 0) {
      return cardssAvailable.reduce((lowest, card) =>
        card.getRank() < lowest.getRank() ? card : lowest,
      );
    }
  }

  // PRIORITY 4: If played card is worth 0 points, discard useless card
  if (playedValue === 0) {
    const nonTrumpCards = botHand.filter(
      (card) => card.getSuit() !== trump && card.getValue() < 0,
    );
    if (nonTrumpCards.length > 0) {
      return nonTrumpCards.reduce((lowest, card) =>
        card.getValue() < lowest.getValue() ? card : lowest,
      );
    }
  }

  // PRIORITY 5: Played card not trump - use SMALLEST trump
  if (!isPlayedTrump) {
    const trumpCards = botHand.filter((card) => card.getSuit() === trump);
    if (trumpCards.length > 0) {
      return trumpCards.reduce((lowest, card) =>
        card.getRank() < lowest.getRank() ? card : lowest,
      );
    }
  }

  // PRIORITY 6: Can't win - discard card with LOWEST VALUE (points)
  const nonTrumpCards = botHand.filter((card) => card.getSuit() !== trump);
  if (nonTrumpCards.length > 0) {
    return nonTrumpCards.reduce((lowest, card) =>
      card.getRank() < lowest.getRank() ? card : lowest,
    );
  }

  // PRIORITY 7: Only trump cards left - play lowest rank
  return botHand.reduce((lowest, card) =>
    card.getRank() < lowest.getRank() ? card : lowest,
  );
};

// Helper function to create a deck of cards
const createDeck = () => {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(new Card(suit, rank));
    }
  }
  return deck;
};

// Helper function to shuffle deck
const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Helper function to deal cards
const dealCards = (deck, numCards) => {
  return deck.splice(0, numCards);
};

// Helper function to display card
const displayCard = (card) => {
  return `${card.getFigure()} of ${card.getSuit()}`;
};

// Helper function to display hand
const displayHand = (hand) => {
  return hand
    .map((card, index) => `${index + 1}: ${displayCard(card)}`)
    .join("\n");
};

// Function to simulate card counting
const simulateCardCounting = (playedCards) => {
  const suitsCounts = suits.map((suit) => ({
    suit: suit,
    knownInGame: playedCards.filter((card) => card.getSuit() === suit).length,
    ranks: playedCards
      .filter((card) => card.getSuit() === suit)
      .map((card) => card.getRank()),
  }));
  return suitsCounts;
};

// Main test function
const testBotGame = () => {
  console.log("=== BOT GAME TEST ===\n");

  // Create and shuffle deck
  let deck = createDeck();
  deck = shuffleDeck(deck);

  // Deal hands (10 cards each for a simplified test)
  const playerHand = dealCards(deck, 10);
  const botHand = dealCards(deck, 10);

  // Set trump suit (randomly)
  const trump = suits[Math.floor(Math.random() * suits.length)];
  console.log(`Trump suit: ${trump}\n`);

  // Game state
  let playedCards = [];
  let playerScore = 0;
  let botScore = 0;
  let assistNeeded = Math.random() > 0.5; // Random for testing

  console.log(`Assist needed: ${assistNeeded}\n`);
  console.log("Your hand:");
  console.log(displayHand(playerHand));
  console.log("\n" + "=".repeat(50) + "\n");

  // Simulate 5 rounds
  for (let round = 1; round <= 5; round++) {
    console.log(`--- ROUND ${round} ---`);

    let playerCard, botCard;
    let playerLeads = round % 2 === 1; // Alternate who leads

    // Get suit counts for bot decision making
    const suitsCounts = simulateCardCounting(playedCards);

    if (playerLeads) {
      // Player leads - simulate choosing a card (pick random for test)
      const playerCardIndex = Math.floor(Math.random() * playerHand.length);
      playerCard = playerHand.splice(playerCardIndex, 1)[0];
      console.log(`You played: ${displayCard(playerCard)}`);

      // Bot responds
      botCard = chooseBestResponse(playerCard, botHand, trump, assistNeeded);
      const botCardIndex = botHand.findIndex(
        (card) =>
          card.getSuit() === botCard.getSuit() &&
          card.getRank() === botCard.getRank(),
      );
      botHand.splice(botCardIndex, 1);
      console.log(`Bot played: ${displayCard(botCard)}`);
    } else {
      // Bot leads
      botCard = chooseBestLead(botHand, trump, assistNeeded, suitsCounts);
      const botCardIndex = botHand.findIndex(
        (card) =>
          card.getSuit() === botCard.getSuit() &&
          card.getRank() === botCard.getRank(),
      );
      botHand.splice(botCardIndex, 1);
      console.log(`Bot played: ${displayCard(botCard)}`);

      // Player responds - simulate choosing a card (pick random for test)
      const playerCardIndex = Math.floor(Math.random() * playerHand.length);
      playerCard = playerHand.splice(playerCardIndex, 1)[0];
      console.log(`You played: ${displayCard(playerCard)}`);
    }

    // Determine winner
    const result = selectPlayWinner(
      playerLeads ? playerCard : botCard,
      playerLeads ? botCard : playerCard,
      trump,
    );
    const roundPoints = playerCard.getValue() + botCard.getValue();

    let winner;
    if (playerLeads) {
      winner = result.winner === 1 ? "player" : "bot";
    } else {
      winner = result.winner === 1 ? "bot" : "player";
    }

    if (winner === "player") {
      playerScore += roundPoints;
      console.log(`You won the round! (+${roundPoints} points)`);
      playerLeads = true; // Winner leads next round
    } else {
      botScore += roundPoints;
      console.log(`Bot won the round! (+${roundPoints} points)`);
      playerLeads = false; // Winner leads next round
    }

    // Add played cards to history
    playedCards.push(playerCard, botCard);

    console.log(`Score - You: ${playerScore}, Bot: ${botScore}`);
    console.log(`Cards remaining: ${playerHand.length}\n`);
  }

  console.log("=== GAME OVER ===");
  console.log(`Final Score - You: ${playerScore}, Bot: ${botScore}`);

  if (playerScore > botScore) {
    console.log("You won!");
  } else if (botScore > playerScore) {
    console.log("Bot won!");
  } else {
    console.log("It's a tie!");
  }

  // Show remaining cards for analysis
  console.log("\nRemaining cards in your hand:");
  console.log(displayHand(playerHand));
  console.log("\nRemaining cards in bot hand:");
  console.log(displayHand(botHand));
};

// Test bot decision making with specific scenarios
// Tests bot decision making in various game scenarios
const testBotDecisionMaking = () => {
  console.log("\n\n=== BOT DECISION TESTS ===\n");

  // Test scenario 1: Bot has strong trump cards
  const testHand1 = [
    new Card("c", 1), // Ace of trump
    new Card("c", 13), // King of trump
    new Card("c", 12), // Queen of trump
    new Card("e", 7),
    new Card("o", 11),
  ];

  const trump1 = "c";
  const assistNeeded1 = true;
  const suitsCounts1 = [
    { suit: "c", knownInGame: 2, ranks: [9, 8] },
    { suit: "e", knownInGame: 3, ranks: [10, 7, 6] },
    { suit: "o", knownInGame: 1, ranks: [6] },
    { suit: "p", knownInGame: 0, ranks: [] },
  ];

  console.log("Test 1 - Bot with strong trump cards:");
  console.log("Bot hand:", testHand1.map(displayCard).join(", "));
  console.log("Trump:", trump1);
  console.log("Assist needed:", assistNeeded1);

  const leadChoice1 = chooseBestLead(
    testHand1,
    trump1,
    assistNeeded1,
    suitsCounts1,
  );
  console.log("Bot chooses to lead:", displayCard(leadChoice1));
  console.log("Reason: Should test PRIORITY 1.1 logic\n");

  // Test scenario 2: Bot needs to assist but has weak hand
  const testHand2 = [
    new Card("e", 7),
    new Card("o", 11),
    new Card("p", 2),
    new Card("c", 3),
  ];

  const trump2 = "c";
  const assistNeeded2 = true;
  const suitsCounts2 = [
    { suit: "c", knownInGame: 5, ranks: [10, 9, 8, 7, 6] },
    { suit: "e", knownInGame: 2, ranks: [10, 9] },
    { suit: "o", knownInGame: 1, ranks: [10] },
    { suit: "p", knownInGame: 3, ranks: [10, 9, 8] },
  ];

  console.log("Test 2 - Bot with weak hand, assist needed:");
  console.log("Bot hand:", testHand2.map(displayCard).join(", "));
  console.log("Trump:", trump2);
  console.log("Assist needed:", assistNeeded2);

  const leadChoice2 = chooseBestLead(
    testHand2,
    trump2,
    assistNeeded2,
    suitsCounts2,
  );
  console.log("Bot chooses to lead:", displayCard(leadChoice2));
  console.log("Reason: Should test PRIORITY 1.2 or fallback logic\n");
};

// Run tests
console.log("Starting bot tests...\n");
testBotGame();
testBotDecisions();

export { testBotGame, testBotDecisions };
