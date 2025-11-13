/**
 * @fileoverview Constantes relacionadas às cartas do jogo Bisca
 */

/**
 * Naipes disponíveis no jogo
 * @typedef {Object} Suits
 * @property {string} COPAS - Copas (c)
 * @property {string} ESPADAS - Espadas (e)
 * @property {string} OUROS - Ouros (o)
 * @property {string} PAUS - Paus (p)
 */
export const SUITS = {
  COPAS: 'c',
  ESPADAS: 'e',
  OUROS: 'o',
  PAUS: 'p'
}

/**
 * Valores das cartas
 * @typedef {Object} CardValues
 */
export const CARD_VALUES = {
  AS: 1,
  DOIS: 2,
  TRES: 3,
  QUATRO: 4,
  CINCO: 5,
  SEIS: 6,
  SETE: 7,
  VALETE: 11,
  DAMA: 12,
  REI: 13
}

/**
 * Símbolos dos naipes
 * @typedef {Object} SuitSymbols
 */
export const SUIT_SYMBOLS = {
  [SUITS.COPAS]: '♥',
  [SUITS.ESPADAS]: '♠',
  [SUITS.OUROS]: '♦',
  [SUITS.PAUS]: '♣'
}

/**
 * Nomes dos naipes em português
 * @typedef {Object} SuitNames
 */
export const SUIT_NAMES = {
  [SUITS.COPAS]: 'Copas',
  [SUITS.ESPADAS]: 'Espadas',
  [SUITS.OUROS]: 'Ouros',
  [SUITS.PAUS]: 'Paus'
}

/**
 * Cores dos naipes (vermelhos vs pretos)
 * @typedef {Object} SuitColors
 */
export const SUIT_COLORS = {
  [SUITS.COPAS]: '#dc2626',
  [SUITS.OUROS]: '#dc2626',
  [SUITS.ESPADAS]: '#374151',
  [SUITS.PAUS]: '#374151'
}

/**
 * Mapeamento de valores para display
 * @typedef {Object} DisplayValues
 */
export const DISPLAY_VALUES = {
  [CARD_VALUES.AS]: 'A',
  [CARD_VALUES.DOIS]: '2',
  [CARD_VALUES.TRES]: '3',
  [CARD_VALUES.QUATRO]: '4',
  [CARD_VALUES.CINCO]: '5',
  [CARD_VALUES.SEIS]: '6',
  [CARD_VALUES.SETE]: '7',
  [CARD_VALUES.VALETE]: 'J',
  [CARD_VALUES.DAMA]: 'Q',
  [CARD_VALUES.REI]: 'K'
}

/**
 * Pontos de cada carta na Bisca
 * @typedef {Object} CardPoints
 */
export const CARD_POINTS = {
  [CARD_VALUES.AS]: 11,
  [CARD_VALUES.SETE]: 10,
  [CARD_VALUES.REI]: 4,
  [CARD_VALUES.DAMA]: 3,
  [CARD_VALUES.VALETE]: 2,
  [CARD_VALUES.DOIS]: 0,
  [CARD_VALUES.TRES]: 0,
  [CARD_VALUES.QUATRO]: 0,
  [CARD_VALUES.CINCO]: 0,
  [CARD_VALUES.SEIS]: 0
}

/**
 * Tamanhos disponíveis para as cartas
 * @typedef {Object} CardSizes
 */
export const CARD_SIZES = {
  XSMALL: 'xsmall',
  SMALL: 'small',
  NORMAL: 'normal',
  LARGE: 'large',
  XLARGE: 'xlarge'
}

/**
 * Dimensões das cartas por tamanho
 * @typedef {Object} CardDimensions
 */
export const CARD_DIMENSIONS = {
  [CARD_SIZES.XSMALL]: { width: '45px', height: '63px' },
  [CARD_SIZES.SMALL]: { width: '60px', height: '84px' },
  [CARD_SIZES.NORMAL]: { width: '80px', height: '112px' },
  [CARD_SIZES.LARGE]: { width: '100px', height: '140px' },
  [CARD_SIZES.XLARGE]: { width: '120px', height: '168px' }
}

/**
 * Todas as cartas do baralho
 * @type {Array<{suit: string, value: number}>}
 */
export const FULL_DECK = Object.values(SUITS).flatMap(suit =>
  Object.values(CARD_VALUES).map(value => ({ suit, value }))
)

/**
 * Caminho base para as imagens das cartas
 * @type {string}
 */
export const CARD_IMAGES_PATH = '/assets/cards/cards1'

/**
 * Nome do arquivo da imagem do verso das cartas
 * @type {string}
 */
export const CARD_BACK_IMAGE = 'semFace.png'

/**
 * Array com todos os naipes para iteração
 * @type {string[]}
 */
export const SUITS_ARRAY = Object.values(SUITS)

/**
 * Array com todos os valores para iteração
 * @type {number[]}
 */
export const VALUES_ARRAY = Object.values(CARD_VALUES)
