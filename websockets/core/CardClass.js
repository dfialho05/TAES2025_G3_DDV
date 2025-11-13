const suits = ["c", "e", "o", "p"]; // naipes - [copas - espadas - ouros - paus]

// the property values are directly related to the image names in the front-end
const cardValues = {
  2: { order: 1, points: 0 }, // Dois
  3: { order: 2, points: 0 }, // Três
  4: { order: 3, points: 0 }, // Quatro
  5: { order: 4, points: 0 }, // Cinco
  6: { order: 5, points: 0 }, // Seis
  12: { order: 6, points: 2 }, // Dama
  11: { order: 7, points: 3 }, // Valete
  13: { order: 8, points: 4 }, // Rei
  7: { order: 9, points: 10 }, // Sete
  1: { order: 10, points: 11 }, // Ás
};

class Card {
  constructor(suit, value) {
    this.suit = suit; // c, e, o, p
    this.cardFigure = value; // The card's figure (A, 2, 3, 4, 5, 6, 7, J, Q, K)
    this.rank = cardValues[value].order; // The card order
    this.value = cardValues[value].points; // The card value
    this.face = this.suit + this.cardFigure; // The card's face (e.g., 'c2', 'e3', 'o4', 'p5')
  }

  getSuit() {
    return this.suit;
  }

  getFigure() {
    return this.cardFigure;
  }

  getRank() {
    return this.rank;
  }

  getValue() {
    return this.value;
  }

  getFace() {
    return this.face;
  }
}

export { Card, suits };
