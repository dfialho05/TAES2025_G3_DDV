/**
 * Frontend integration guide + example code for Bisca WebSocket server
 *
 * This file explains how to integrate the websockets backend implemented in
 * `websockets/` with a browser or React frontend. It contains:
 *  - Required socket events and payload shapes
 *  - Minimal browser example using Socket.IO client
 *  - React (hook) examples for listening and emitting events
 *  - Notes about card payload format, bot play and timers
 *
 * Summary of important server-side socket events (from server code):
 *  - connection: client must `emit("join", user)` to register on server
 *  - create-game: emit("create-game", handSize)          // handSize = 3 or 9
 *  - get-games: emit("get-games")                       // server replies with "games"
 *  - join-game: emit("join-game", gameID, userOrUserID) // join an existing game room
 *  - flip-card: emit("flip-card", gameID, cardPayload)  // play a card (cardPayload described below)
 *  - server emits "games" (list) and "game-change" (updated game state for a room)
 *
 * Note on data shapes:
 *  - Cards arriving from the server will be plain objects with properties defined
 *    in the server's Card class: { suit, cardFigure, rank, value, face }
 *    Example face: "c1" (suit 'c' + figure '1') or "p13".
 *  - When sending a play to the server use the `face` format for simplicity:
 *    { face: "c1" } or simply "c1" (server normalizer accepts multiple shapes).
 *
 * Always call `socket.emit("join", user)` right after connecting so server
 * knows who you are. The server uses socket.id internally but also stores
 * user.id and user.name.
 */

/* -------------------------------------------------------------------------- */
/* Minimal browser example (plain JS with socket.io-client)                    */
/* -------------------------------------------------------------------------- */
/*
<script src="/socket.io/socket.io.js"></script>
<script>
  // If using the socket.io client build served from the same host:
  const serverUrl = "http://localhost:3000"; // change to your server
  const socket = io(serverUrl, {
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
  });

  // Example user object; anonymous users must still provide some id/name
  const me = { id: "user-123", name: "Alice" };

  socket.on("connect", () => {
    console.log("connected", socket.id);
    // Register user with server-state
    socket.emit("join", me);

    // Request list of games
    socket.emit("get-games");
  });

  // List of available games
  socket.on("games", (gamesList) => {
    console.log("games:", gamesList);
    // render UI to allow creating / joining games
  });

  // Each game room will emit real-time updates
  socket.on("game-change", (game) => {
    console.log("game-change:", game);
    // update client UI with new state
  });

  // Create a new game (3 or 9 card variant)
  function createGame(handSize = 3) {
    socket.emit("create-game", handSize);
  }

  // Join a game - server join-game handler accepts (gameID, userID | userObject)
  function joinGame(gameID) {
    socket.emit("join-game", gameID, me);
    // also join client-side room if needed, server will add socket to room
  }

  // Play a card: use `face` property as card identifier
  // e.g. to play Ace of 'c', face might be "c1"
  function playCard(gameID, face) {
    // payload can be just a string or object { face: "c1" }
    socket.emit("flip-card", gameID, { face });
  }

  // Example: resign from game (call server-state function via custom event if you add it)
  // socket.emit("resign-game", gameID);
</script>
*/

/* -------------------------------------------------------------------------- */
/* React example: hook-based usage (using `socket.io-client` package)         */
/* -------------------------------------------------------------------------- */
/*
Install client library:
  npm i socket.io-client

Example `useGameSocket.js` hook:
*/
import { io } from "socket.io-client"; // in real frontend, install socket.io-client
import { useEffect, useRef, useState, useCallback } from "react";

export function useGameSocket({ serverUrl, user }) {
  const socketRef = useRef(null);
  const [games, setGames] = useState([]); // list of available games
  const [currentGame, setCurrentGame] = useState(null); // the game you joined/viewing
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Tell the server who we are
      socket.emit("join", user);
      // Ask for available games list
      socket.emit("get-games");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("games", (gamesList) => {
      setGames(gamesList);
    });

    socket.on("game-change", (gameState) => {
      // The server may emit many game updates; if it's the one you're viewing, update local state
      if (!currentGame || currentGame.id !== gameState.id) {
        // optionally update list or ignore
      } else {
        setCurrentGame(gameState);
      }
      // If you're listening to a room this is where you update UI
      // You might also update games list if it contains summary info
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, user]);

  // Create game
  const createGame = useCallback(
    (handSize = 3) => {
      if (!socketRef.current) return;
      socketRef.current.emit("create-game", handSize);
    },
    [socketRef],
  );

  // Join game and subscribe to room events; server will add us to game room
  const joinGame = useCallback(
    (gameID) => {
      if (!socketRef.current) return;
      socketRef.current.emit("join-game", gameID, user);
      // We also set the current game client-side; the server should soon emit "game-change"
      setCurrentGame({ id: gameID });
    },
    [socketRef, user],
  );

  // Play a card
  const playCard = useCallback(
    (gameID, cardFace) => {
      if (!socketRef.current) return;
      // server-side flipCard normalizer accepts object with `face`, so we send that
      socketRef.current.emit("flip-card", gameID, { face: cardFace });
    },
    [socketRef],
  );

  return {
    connected,
    games,
    currentGame,
    createGame,
    joinGame,
    playCard,
    socket: socketRef.current,
  };
}

/* -------------------------------------------------------------------------- */
/* Notes on client-side rendering and safety                                  */
/* -------------------------------------------------------------------------- */
/*
1) Card representation
   - Server will send objects like { suit: 'c', cardFigure: 1, rank: 10, value: 11, face: 'c1' }.
   - Keep the `face` string as your canonical identifier for plays.
   - When rendering a card image, use `face` to build image path: e.g. `/assets/cards/${face}.png`.

2) Turn validation and UI
   - Server is authoritative. Client can optionally enforce UI-level validation
     using local logic, but always expect server to reject illegal moves.
   - When user tries to play out of turn, the server will ignore; your UI should
     gray-out opponent buttons and only allow playing when `game.currentPlayer === myId`.

3) Timeouts / resignation
   - Server rules mention a 20s timer: if you implement client timer, you should
     call a `resign` event (not implemented in the template) or allow server to
     enforce moving player timeout. The template includes a `resignGame` function
     in the state module - you can add a socket event (e.g. "resign-game") that
     the server calls to finalize a resignation. Check the server & state code to
     align the exact event name if you add it.

4) Bot games
   - If you want to play against the bot, the server provides a `setBotForGame` helper
     used by the state module. The client can create a game and request a bot to join
     by emitting e.g. `join-game` with user `{ id: 'bot', name: 'BOT' }` OR the server
     can expose a dedicated `play-vs-bot` event. Check server `events/game.js` and
     update to support the flow you need.
   - When the bot plays, `game-change` will be emitted with updates; handle them the same way.

5) Serialization caveat
   - The server stores Card instances. Socket.IO will serialize them into plain objects
     (no methods). Do not try to call `getFace()` on a received card object. Use the
     plain properties (e.g., card.face) or reconstruct a client Card model if needed.

6) Example state mapping
   - Example `game-change` payload fields you will typically see (based on server state):
     {
       id,
       player1,
       player2,
       player1Hand: [{suit, cardFigure, rank, value, face}, ...],
       player2Hand: [...],
       player1Collected: [...],
       player2Collected: [...],
       player1Score,
       player2Score,
       deck: [remaining count or card objects],
       trumpSuit,
       trumpCard: {face, ...},
       currentPlayer, // player id whose turn it is
       leadCard,      // card object of the trick's lead (if a trick is in progress)
       playedCards,   // [ { player, card }, ... ] maybe present transiently
       complete,
       winner
     }

7) Reconnection
   - On reconnect, re-emit `join` to re-register and re-request `get-games`.
   - Consider implementing a small state reconciliation: request server-side game via
     an API or socket event (e.g. "get-game", not present in template but easy to add).

8) Security
   - The server currently trusts the `user` object from the client leaf. For production,
     implement proper authentication and verify player IDs on the server.
*/

/* -------------------------------------------------------------------------- */
/* Quick cheat sheet (client calls)                                           */
/* -------------------------------------------------------------------------- */
/*
  // connect and register
  socket.emit("join", { id: "user-1", name: "Alice" });

  // create a new Bisca game (3 or 9)
  socket.emit("create-game", 3);

  // request games list
  socket.emit("get-games");

  // join an existing game (server may accept user object or id)
  socket.emit("join-game", 42, { id: "user-2", name: "Bob" });

  // play a card (use card.face as identifier)
  socket.emit("flip-card", 42, { face: "c1" });

  // listen for updates to game
  socket.on("game-change", (game) => {
    // update UI
  });
*/

export default null; // file is a guide; export null to avoid accidental runtime usage.
