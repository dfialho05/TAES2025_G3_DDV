import { defineStore } from "pinia";

export const useCardsStore = defineStore("cards", () => {
  // Valid suits and values
  const validSuits = ["c", "e", "o", "p"];
  const validValues = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

  // Import all card images using import.meta.glob
  const cardImageModules = import.meta.glob("../assets/cards1/*.png", {
    eager: true,
  });

  // Create card images mapping
  const cardImages = {};
  let cardBackImage = null;

  // Process imported images
  for (const path in cardImageModules) {
    const fileName = path.split("/").pop().replace(".png", "");

    if (fileName === "semFace") {
      cardBackImage = cardImageModules[path].default;
    } else {
      cardImages[fileName] = cardImageModules[path].default;
    }
  }

  // Get card image by suit and value
  const getCardImage = (suit, value) => {
    const key = `${suit}${value}`;
    return cardImages[key] || null;
  };

  // Get card back image
  const getCardBackImage = () => {
    return cardBackImage;
  };

  // Get all card images
  const getAllCardImages = () => {
    return { ...cardImages };
  };

  // Get suit name in Portuguese
  const getSuitName = (suit) => {
    const suitNames = {
      c: "Copas",
      e: "Espadas",
      o: "Ouros",
      p: "Paus",
    };
    return suitNames[suit] || "Desconhecido";
  };

  // Get suit symbol
  const getSuitSymbol = (suit) => {
    const suitSymbols = {
      c: "♥",
      e: "♠",
      o: "♦",
      p: "♣",
    };
    return suitSymbols[suit] || "?";
  };

  // Get suit color
  const getSuitColor = (suit) => {
    const redSuits = ["c", "o"]; // Copas and Ouros are red
    return redSuits.includes(suit) ? "red" : "black";
  };

  // Get card display name
  const getCardDisplayName = (suit, value) => {
    const valueNames = {
      1: "Ás",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      11: "Valete",
      12: "Dama",
      13: "Rei",
    };

    return `${valueNames[value] || value} de ${getSuitName(suit)}`;
  };

  return {
    // State
    cardImages,
    cardBackImage,
    validSuits,
    validValues,

    // Design Methods (Visual/UI)
    getCardImage,
    getCardBackImage,
    getAllCardImages,
    getSuitName,
    getSuitSymbol,
    getSuitColor,
    getCardDisplayName,
  };
});
