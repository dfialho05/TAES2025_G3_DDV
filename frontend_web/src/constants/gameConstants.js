/**
 * @fileoverview Constantes relacionadas ao jogo Bisca
 */

/**
 * Estados possíveis do jogo
 * @typedef {Object} GameStates
 */
export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
  PAUSED: 'paused'
}

/**
 * Tipos de jogadores
 * @typedef {Object} PlayerTypes
 */
export const PLAYER_TYPES = {
  HUMAN: 'human',
  BOT: 'bot'
}

/**
 * Posições dos jogadores
 * @typedef {Object} PlayerPositions
 */
export const PLAYER_POSITIONS = {
  PLAYER: 'player',
  OPPONENT: 'opponent'
}

/**
 * Configurações do jogo
 * @typedef {Object} GameConfig
 */
export const GAME_CONFIG = {
  MAX_CARDS_PER_PLAYER: 9,
  MIN_CARDS_PER_PLAYER: 3,
  TOTAL_DECK_SIZE: 40,
  POINTS_TO_WIN: 121,
  INITIAL_CARDS_COUNT: 3
}

/**
 * Breakpoints responsivos
 * @typedef {Object} Breakpoints
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
}

/**
 * Configurações de layout responsivo
 * @typedef {Object} ResponsiveConfig
 */
export const RESPONSIVE_CONFIG = {
  MOBILE: {
    MAX_CARDS_SINGLE_ROW: 6,
    CARD_GAPS: ['gap-0.5', 'gap-1', 'gap-1.5', 'gap-2'],
    MAX_WIDTH: ['100vw', '95vw', '90vw']
  },
  DESKTOP: {
    MAX_CARDS_SINGLE_ROW: 8,
    CARD_GAPS: ['gap-1', 'gap-2', 'gap-3', 'gap-4'],
    MAX_WIDTH: ['98vw', '90vw', '85vw']
  }
}

/**
 * Configurações de animação
 * @typedef {Object} AnimationConfig
 */
export const ANIMATION_CONFIG = {
  CARD_SELECTION_ELEVATION: {
    MOBILE: '8px',
    DESKTOP: '15px'
  },
  CARD_HOVER_SCALE: {
    MOBILE: 1.02,
    DESKTOP: 1.05
  },
  TRANSITION_DURATION: '0.3s',
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

/**
 * Mensagens do jogo
 * @typedef {Object} GameMessages
 */
export const GAME_MESSAGES = {
  CARD_SELECTION: 'Selecione uma carta para jogar',
  WAITING_OPPONENT: 'Aguardando jogada do oponente',
  ROUND_WON: 'Você ganhou a rodada!',
  ROUND_LOST: 'Oponente ganhou a rodada',
  GAME_WON: 'Parabéns! Você ganhou o jogo!',
  GAME_LOST: 'Fim de jogo. Você perdeu.',
  INVALID_MOVE: 'Jogada inválida'
}

/**
 * Configurações de debug
 * @typedef {Object} DebugConfig
 */
export const DEBUG_CONFIG = {
  ENABLED: import.meta.env.DEV,
  CARD_COUNT_OPTIONS: [3, 6, 9],
  LOG_MOVES: true,
  SHOW_AI_CARDS: false
}

/**
 * URLs e endpoints da API
 * @typedef {Object} ApiEndpoints
 */
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  GAME: '/api/game',
  MOVES: '/api/moves',
  STATS: '/api/stats'
}

/**
 * Configurações de localStorage
 * @typedef {Object} StorageKeys
 */
export const STORAGE_KEYS = {
  GAME_STATE: 'bisca_game_state',
  USER_PREFERENCES: 'bisca_user_prefs',
  GAME_HISTORY: 'bisca_game_history',
  STATISTICS: 'bisca_statistics'
}

/**
 * Eventos do jogo
 * @typedef {Object} GameEvents
 */
export const GAME_EVENTS = {
  CARD_PLAYED: 'card_played',
  ROUND_COMPLETE: 'round_complete',
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  TRUMP_REVEALED: 'trump_revealed',
  CARDS_DEALT: 'cards_dealt'
}

/**
 * Configurações de tempo
 * @typedef {Object} TimingConfig
 */
export const TIMING_CONFIG = {
  MOVE_TIMEOUT: 30000, // 30 segundos
  ANIMATION_DELAY: 500, // 0.5 segundos
  BOT_THINKING_TIME: 1500, // 1.5 segundos
  ROUND_END_DELAY: 2000 // 2 segundos
}

/**
 * Configurações de som (para futuro)
 * @typedef {Object} SoundConfig
 */
export const SOUND_CONFIG = {
  ENABLED: false,
  VOLUME: 0.7,
  SOUNDS: {
    CARD_FLIP: '/sounds/card_flip.mp3',
    CARD_PLACE: '/sounds/card_place.mp3',
    WIN: '/sounds/win.mp3',
    LOSE: '/sounds/lose.mp3'
  }
}
