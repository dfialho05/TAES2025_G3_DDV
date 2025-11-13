// Static imports for card images
import c1 from "./cards1/c1.png";
import c2 from "./cards1/c2.png";
import c3 from "./cards1/c3.png";
import c4 from "./cards1/c4.png";
import c5 from "./cards1/c5.png";
import c6 from "./cards1/c6.png";
import c7 from "./cards1/c7.png";
import c11 from "./cards1/c11.png";
import c12 from "./cards1/c12.png";
import c13 from "./cards1/c13.png";

import e1 from "./cards1/e1.png";
import e2 from "./cards1/e2.png";
import e3 from "./cards1/e3.png";
import e4 from "./cards1/e4.png";
import e5 from "./cards1/e5.png";
import e6 from "./cards1/e6.png";
import e7 from "./cards1/e7.png";
import e11 from "./cards1/e11.png";
import e12 from "./cards1/e12.png";
import e13 from "./cards1/e13.png";

import o1 from "./cards1/o1.png";
import o2 from "./cards1/o2.png";
import o3 from "./cards1/o3.png";
import o4 from "./cards1/o4.png";
import o5 from "./cards1/o5.png";
import o6 from "./cards1/o6.png";
import o7 from "./cards1/o7.png";
import o11 from "./cards1/o11.png";
import o12 from "./cards1/o12.png";
import o13 from "./cards1/o13.png";

import p1 from "./cards1/p1.png";
import p2 from "./cards1/p2.png";
import p3 from "./cards1/p3.png";
import p4 from "./cards1/p4.png";
import p5 from "./cards1/p5.png";
import p6 from "./cards1/p6.png";
import p7 from "./cards1/p7.png";
import p11 from "./cards1/p11.png";
import p12 from "./cards1/p12.png";
import p13 from "./cards1/p13.png";

import semFace from "./cards1/semFace.png";

// Card images mapping
const cardImageMap = {
  // Copas (Hearts)
  c1,
  c2,
  c3,
  c4,
  c5,
  c6,
  c7,
  c11,
  c12,
  c13,

  // Espadas (Spades)
  e1,
  e2,
  e3,
  e4,
  e5,
  e6,
  e7,
  e11,
  e12,
  e13,

  // Ouros (Diamonds)
  o1,
  o2,
  o3,
  o4,
  o5,
  o6,
  o7,
  o11,
  o12,
  o13,

  // Paus (Clubs)
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p11,
  p12,
  p13,
};

// Card back image
export const cardBackImage = semFace;

// Helper function to get card image
export const getCardImage = (suit, value) => {
  const key = `${suit}${value}`;
  return cardImageMap[key] || null;
};

// Check if card image exists
export const hasCardImage = (suit, value) => {
  const key = `${suit}${value}`;
  return key in cardImageMap;
};

// Export card images for direct access
export const cardImages = cardImageMap;

// Export individual images for debugging
export {
  c1,
  c2,
  c3,
  c4,
  c5,
  c6,
  c7,
  c11,
  c12,
  c13,
  e1,
  e2,
  e3,
  e4,
  e5,
  e6,
  e7,
  e11,
  e12,
  e13,
  o1,
  o2,
  o3,
  o4,
  o5,
  o6,
  o7,
  o11,
  o12,
  o13,
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p11,
  p12,
  p13,
  semFace,
};
