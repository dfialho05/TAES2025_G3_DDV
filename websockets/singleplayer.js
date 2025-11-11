// bot that plays against the user
import { Card, suits } from "./CardClass.js";
import { selectPlayWinner, doAPlay } from "./GameLogic.js";

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

export { chooseBestResponse, chooseBestLead };
