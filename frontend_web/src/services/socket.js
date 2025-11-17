/**
 * TAES2025_G3_DDV/frontend_web/src/services/socket.js
 *
 * WebSocket service for the Bisca frontend (Vue 3).
 * - Uses socket.io-client
 * - Provides a simple singleton API to connect, authenticate, start singleplayer games,
 *   play cards and subscribe to server events.
 *
 * Usage:
 *   import socketService from "@/services/socket.js"
 *   await socketService.init({ playerName: "Alice" })
 *   socketService.on("gameStarted", handler)
 *   socketService.startSingleplayerGame()
 *
 * Configuration:
 *   Set VITE_WS_URL in your environment (e.g. .env) to override the default server URL.
 *   Default: http://localhost:3000
 */

import { io } from "socket.io-client";

const DEFAULT_SERVER_URL = (import.meta && import.meta.env && import.meta.env.VITE_WS_URL) || "http://localhost:3000";

class SocketService {
  constructor() {
    this.serverUrl = DEFAULT_SERVER_URL;
    this.socket = null;
    this.playerName = null;
    this.gameId = null;
    this._connected = false;

    // Map of eventName -> Set of callbacks
    this.listeners = new Map();

    // Temporary once listeners (event -> Set)
    this.onceListeners = new Map();

    // Bound handlers so we can remove them if needed
    this._internalHandlers = {};
  }

  /**
   * Initialize the service and connect to server.
   * If already connected, it will re-use the socket and authenticate if playerName provided.
   *
   * options: { playerName?: string, serverUrl?: string }
   */
  init(options = {}) {
    const { playerName, serverUrl } = options;
    if (serverUrl) this.serverUrl = serverUrl;
    if (playerName) this.playerName = playerName;

    if (!this.socket) {
      this._createSocket();
    } else if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }

    return this;
  }

  _createSocket() {
    this.socket = io(this.serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    // Setup internal listeners
    this._internalHandlers.connect = () => {
      this._connected = true;
      // If we have a playerName we should authenticate on connect
      if (this.playerName) {
        this.emitAuth(this.playerName);
      }
      this._emitLocal("connect", { socketId: this.socket.id });
    };

    this._internalHandlers.disconnect = (reason) => {
      this._connected = false;
      this._emitLocal("disconnect", { reason });
    };

    this._internalHandlers.connect_error = (err) => {
      this._emitLocal("connect_error", err);
    };

    // Generic forwarder for known events
    const forwardEvents = [
      "authSuccess",
      "authError",
      "gameStarted",
      "cardPlayed",
      "botCardPlayed",
      "roundResult",
      "gameStateUpdate",
      "gameRecovered",
      "gameError",
      "turnTimerStarted",
      "turnTimerUpdate",
      "playerTimeout",
      "roundEnded",
      "gameStateResponse",
      "reconnectSuccess",
      "roomCreated",
      "roomJoined",
      "roomsList",
      "roomError",
    ];

    // Register internal handlers
    this.socket.on("connect", this._internalHandlers.connect);
    this.socket.on("disconnect", this._internalHandlers.disconnect);
    this.socket.on("connect_error", this._internalHandlers.connect_error);

    for (const ev of forwardEvents) {
      this.socket.on(ev, (payload) => {
        this._emitLocal(ev, payload);
      });
    }

    // Also forward any event the server sends (for debug / extensibility)
    // Note: socket.onAny exists in socket.io client v3+
    if (typeof this.socket.onAny === "function") {
      this.socket.onAny((event, ...args) => {
        // Do not double-forward events we already handle above
        if (!forwardEvents.includes(event) && event !== "connect" && event !== "disconnect" && event !== "connect_error") {
          this._emitLocal(event, args.length > 1 ? args : args[0]);
        }
      });
    }
  }

  /**
   * Register a callback for an event coming from the server.
   * Returns an unsubscribe function.
   */
  on(eventName, cb) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(cb);
    return () => this.off(eventName, cb);
  }

  /**
   * Register a one-time callback for an event.
   */
  once(eventName, cb) {
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, new Set());
    }
    this.onceListeners.get(eventName).add(cb);
    return () => {
      const set = this.onceListeners.get(eventName);
      if (set) set.delete(cb);
    };
  }

  off(eventName, cb) {
    const set = this.listeners.get(eventName);
    if (set) {
      set.delete(cb);
      if (set.size === 0) this.listeners.delete(eventName);
    }
  }

  _emitLocal(eventName, payload) {
    // Call persistent listeners
    const set = this.listeners.get(eventName);
    if (set) {
      for (const cb of Array.from(set)) {
        try {
          cb(payload);
        } catch (err) {
          // keep running other listeners
          // eslint-disable-next-line no-console
          console.error("[socketService] listener error", eventName, err);
        }
      }
    }

    // Call once listeners and remove them
    const onceSet = this.onceListeners.get(eventName);
    if (onceSet) {
      for (const cb of Array.from(onceSet)) {
        try {
          cb(payload);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[socketService] once listener error", eventName, err);
        }
      }
      this.onceListeners.delete(eventName);
    }
  }

  /**
   * Emit wrapper that only emits if socket is connected.
   * Returns boolean (true = emitted).
   */
  emit(eventName, data = {}) {
    if (!this.socket) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] socket not initialized, call init() first");
      return false;
    }
    if (!this.socket.connected) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] socket not connected, can't emit", eventName);
      return false;
    }
    try {
      this.socket.emit(eventName, data);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[socketService] emit error", eventName, err);
      return false;
    }
  }

  // Convenience wrappers for server contract

  emitAuth(playerName) {
    if (playerName) this.playerName = playerName;
    return this.emit("auth", { playerName });
  }

  /**
   * Start a singleplayer game against bot.
   * server expects: startSingleplayerGame { playerName, turnTime }
   */
  startSingleplayerGame(turnTime = 30) {
    if (!this.playerName) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] startSingleplayerGame called without playerName");
    }
    const payload = { playerName: this.playerName, turnTime };
    const ok = this.emit("startSingleplayerGame", payload);
    if (!ok) {
      // fallback: schedule emit once connected
      this.once("connect", () => {
        this.emit("startSingleplayerGame", payload);
      });
    }
    return ok;
  }

  /**
   * Play a card.
   * server expects: playCard { gameId, playerName, cardFace }
   * cardFace must follow server format (e.g. 'c7', 'p1', ...)
   */
  playCard({ gameId = this.gameId, playerName = this.playerName, cardFace }) {
    if (!gameId) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] playCard missing gameId");
      return false;
    }
    const payload = { gameId, playerName, cardFace };
    return this.emit("playCard", payload);
  }

  /**
   * Request full game state from server
   */
  requestGameState(gameId = this.gameId) {
    if (!gameId) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] requestGameState missing gameId");
      return false;
    }
    this.emit("getGameState", { gameId });
    return true;
  }

  createRoom({ playerName = this.playerName, roomOptions = {} }) {
    if (!playerName) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] createRoom missing playerName");
      return false;
    }
    this.emit("createRoom", { playerName, roomOptions });
    return true;
  }

  joinRoom({ gameId, playerName = this.playerName, password = null }) {
    if (!gameId || !playerName) {
      // eslint-disable-next-line no-console
      console.warn("[socketService] joinRoom missing gameId/playerName");
      return false;
    }
    this.emit("joinRoom", { gameId, playerName, password });
    return true;
  }

  listRooms() {
    this.emit("listRooms");
  }

  /**
   * Save the current gameId locally in the service (useful after gameStarted)
   */
  setCurrentGameId(gameId) {
    this.gameId = gameId;
  }

  getCurrentGameId() {
    return this.gameId;
  }

  isConnected() {
    return !!(this.socket && this.socket.connected);
  }

  /**
   * Disconnect and cleanup socket. After calling destroy, call init() again to recreate.
   */
  destroy() {
    if (this.socket) {
      try {
        // remove internal handlers
        this.socket.off("connect", this._internalHandlers.connect);
        this.socket.off("disconnect", this._internalHandlers.disconnect);
        this.socket.off("connect_error", this._internalHandlers.connect_error);
        // remove other listeners by closing the socket
        this.socket.disconnect();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[socketService] destroy error", err);
      }
    }
    this.socket = null;
    this._connected = false;
    this.listeners.clear();
    this.onceListeners.clear();
    this._internalHandlers = {};
    this.playerName = null;
    this.gameId = null;
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
