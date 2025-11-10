import { Card, suits } from "./CardClass.js";

// player1, card1 always refferes to the first one playing the card

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

const doAPlay = (deck, trump, player1Card, player2Hand, player2Card) => {
  // Verify if deck is empty and both cards has the same suit
  if (deck.length === 0 && player1Card.getSuit() !== player2Card.getSuit()) {
    if (player2Hand.some((card) => card.getSuit() === player1Card.getSuit())) {
      throw new Error("Invalid play");
    }
  }
  return selectPlayWinner(player1Card, player2Card, trump);
};

export { selectPlayWinner, verifyDeckEmpty, doAPlay };
