import { defineStore } from "pinia";

export const useCardsStore = defineStore("cards", () => {
  // Valid suits and values
  const validSuits = ["c", "e", "o", "p"];
  const validValues = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

  // Import all card images using import.meta.glob (attempt to load from bundled assets)
  const cardImageModules = import.meta.glob("../assets/cards1/*.png", {
    eager: true,
  });

  // Create card images mapping
  const cardImages = {};
  let cardBackImage = null;

  // Process imported images (support both module.default and direct string)
  for (const path in cardImageModules) {
    const fileName = path.split("/").pop().replace(".png", "");
    const mod = cardImageModules[path];
    const url = (mod && (mod.default || mod)) || null;

    if (fileName === "semFace") {
      cardBackImage = url;
    } else if (url) {
      cardImages[fileName] = url;
    }
  }

  // Helper: build public URL fallback for a given key (ex: 'c1' -> '/cards1/c1.png')
  const publicCardUrl = (key) => `/cards1/${key}.png`;

  // Get card image by suit and value: prefer bundled asset, then public fallback
  const getCardImage = (suit, value) => {
    const key = `${suit}${value}`;
    if (cardImages[key]) return cardImages[key];
    // fallback to public folder (Vite serves files from `public/` at root)
    return publicCardUrl(key);
  };

  // Get card back image with fallback to public folder
  const getCardBackImage = () => {
    return cardBackImage || publicCardUrl("semFace");
  };

  // Get all card images, include public fallback for missing ones
  const getAllCardImages = () => {
    const all = {};
    for (const s of validSuits) {
      for (const v of validValues) {
        const key = `${s}${v}`;
        all[key] = cardImages[key] || publicCardUrl(key);
      }
    }
    all["semFace"] = cardBackImage || publicCardUrl("semFace");
    return all;
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
