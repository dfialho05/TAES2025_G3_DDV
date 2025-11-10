// bot that plays against the user
import { Card, suits } from "./CardClass.js";
import { selectPlayWinner, doAPlay } from "./GameLogic.js";

const chooseBestResponse = (cardPlayed, botHand, trump, assistNeeded) => {
  if (!botHand || botHand.length === 0) {
    throw new Error("Bot hand is empty");
  }

  const playedSuit = cardPlayed.getSuit();
  const playedRank = cardPlayed.getRank();
  const playedValue = cardPlayed.getValue();
  const isPlayedTrump = playedSuit === trump;

  // PRIORITY 1: Win with same suit (higher rank) - choose highest winning rank
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

  // PRIORITY 2: If played card is worth 0 points, discard useless card
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

  // PRIORITY 3: Both trump cards - choose SMALLEST trump that wins
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

  // PRIORITY 4: Played card not trump - use SMALLEST trump
  if (!isPlayedTrump) {
    const trumpCards = botHand.filter((card) => card.getSuit() === trump);
    if (trumpCards.length > 0) {
      return trumpCards.reduce((lowest, card) =>
        card.getRank() < lowest.getRank() ? card : lowest,
      );
    }
  }

  // PRIORITY 5: Can't win - discard card with LOWEST VALUE (points)
  const nonTrumpCards = botHand.filter((card) => card.getSuit() !== trump);
  if (nonTrumpCards.length > 0) {
    return nonTrumpCards.reduce((lowest, card) =>
      card.getValue() < lowest.getValue() ? card : lowest,
    );
  }

  // PRIORITY 6: Only trump cards left - play lowest rank
  return botHand.reduce((lowest, card) =>
    card.getRank() < lowest.getRank() ? card : lowest,
  );
};

export { chooseBestResponse };
