// const suits = ["c", "e", "o", "p"]; // naipes - [copas - espadas - ouros - paus]

// const rankValues = {
//   2: { order: 1, points: 0 }, // Dois
//   3: { order: 2, points: 0 }, // Três
//   4: { order: 3, points: 0 }, // Quatro
//   5: { order: 4, points: 0 }, // Cinco
//   6: { order: 5, points: 0 }, // Seis
//   12: { order: 6, points: 2 }, // Dama
//   11: { order: 7, points: 3 }, // Valete
//   13: { order: 8, points: 4 }, // Rei
//   7: { order: 9, points: 10 }, // Sete
//   1: { order: 10, points: 11 }, // Ás
// };

// Function to shuffle the deck
// const shuffle = (deck) => {
//   for (let i = deck.length - 1; i > 0; i--) {
//     let j = Math.floor(Math.random() * (i + 1));
//     let k = deck[i];
//     deck[i] = deck[j];
//     deck[j] = k;
//   }
//   return deck;
// };

// Function to create a deck of cards
// const createDeck = () => {
//   const deck = [];
//   suits.forEach((suit) => {
//     Object.keys(rankValues).forEach((rank) => {
//       deck.push({
//         suit: suit, // Naipe da carta (c: Copas, e: Espadas, o: Ouros, p: Paus)
//         rank: rank, // Valor/nome da carta (2, 3, 4, 5, 6, Q, J, K, 7, A)
//         value: rankValues[rank], // Objeto com ordem e pontos da carta
//         face: `${suit}${rank}`, // Display da carta (ex: "c")
//       });
//     });
//   });
//   return shuffle(deck);
// };

// Function to get the trump suit
// const getTrump = (deck) => {
//   if (!deck || deck.length === 0) return null;
//   const lastCard = deck[deck.length - 1];
//   return lastCard.suit;
// };

// Function to deal cards
// const dealCard = (deck) => {
//   if (deck.length === 0) {
//     return null;
//   }
//   const card = deck.pop();
//   return card;
// };

// Function to deal the first 9 cards
// const dealFirst9Cards = (deck) => {
//   const cards = [];
//   for (let i = 0; i < 9; i++) {
//     if (deck.length === 0) {
//       break;
//     }
//     cards.push(dealCard(deck));
//   }
//   return cards;
// };

// Function to check if a card is trump
// const isCardTrump = (card, trump) => {
//   return getCardSuit(card) == trump;
// };
