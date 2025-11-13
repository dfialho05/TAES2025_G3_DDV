// Game rules that determine card play winners and validate moves
import { Card, suits } from "./CardClass.js";

// player1, card1 always refers to the first one playing the card

// Determines the winner between two cards based on trump suit and card values
const selectPlayWinner = (card1, card2, trump) => {
  // Verifies if both cards are valid Card objects and if the trump suit is valid
  if (
    !(card1 instanceof Card) ||
    !(card2 instanceof Card) ||
    !suits.includes(trump)
  ) {
    throw new Error(
      "Both parameters must be Card objects and trump suit must be valid",
    );
  }

  // If the first card is trump and the second card is not trump, the first card wins
  if (card1.getSuit() === trump && card2.getSuit() !== trump) {
    return { winner: 1, card1, card2 };
  }

  // If the second card is trump and the first card is not trump, the second card wins
  if (card2.getSuit() === trump && card1.getSuit() !== trump) {
    return { winner: 2, card1, card2 };
  }

  // If both cards are of the same suit, the higher value wins
  if (card1.getSuit() === card2.getSuit()) {
    return { winner: card1.getRank() > card2.getRank() ? 1 : 2, card1, card2 };
  }

  // the first card wins by default
  return { winner: 1, card1, card2 };
};

// Validates a single card play according to game rules
const validateCardPlay = (deck, trump, leadCard, playerHand, playerCard) => {
  // If no lead card, any card is valid (player is leading)
  if (!leadCard) {
    return { valid: true };
  }

  // Safety check: ensure leadCard has getSuit method
  if (typeof leadCard.getSuit !== "function") {
    console.warn("leadCard não tem método getSuit(), permitindo jogada");
    return { valid: true };
  }

  // If deck is empty, player must follow suit if possible
  if (deck.length === 0) {
    const leadSuit = leadCard.getSuit();
    const hasSameSuit = playerHand.some((card) => card.getSuit() === leadSuit);

    if (hasSameSuit && playerCard.getSuit() !== leadSuit) {
      return {
        valid: false,
        reason: "Deve seguir o naipe quando possível e o baralho está vazio",
      };
    }
  }

  return { valid: true };
};

// Validates and executes a play between two players
const doAPlay = (deck, trump, player1Card, player2Hand, player2Card) => {
  if (deck.length === 0 && player1Card.getSuit() !== player2Card.getSuit()) {
    if (player2Hand.some((card) => card.getSuit() === player1Card.getSuit())) {
      throw new Error("Invalid play");
    }
  }
  return selectPlayWinner(player1Card, player2Card, trump);
};

export { selectPlayWinner, doAPlay, validateCardPlay };
