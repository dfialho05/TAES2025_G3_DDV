import { getUser } from "../state/connection.js";
import {
  createGame,
  getGames,
  joinGame,
  flipCard,
  clearFlippedCard,
} from "../state/game.js";
import { server } from "../server.js";

export const handleGameEvents = (io, socket) => {
  socket.on("create-game", (difficulty) => {
    const user = getUser(socket.id);
    const game = createGame(difficulty, user);
    socket.join(`game-${game.id}`);
    console.log(`[Game] ${user.name} created a new game - ID: ${game.id}`);
    io.emit("games", getGames());
  });

  socket.on("get-games", () => {
    socket.emit("games", getGames());
  });

  socket.on("join-game", (gameID, userID) => {
    joinGame(gameID, userID);
    socket.join(`game-${gameID}`);
    console.log(`[Game] User ${userID} joined game ${gameID}`);
    io.emit("games", getGames());
  });

  socket.on("flip-card", (gameID, card) => {
    const user = getUser(socket.id);
    console.log(
      "flip-card event received:",
      gameID,
      card,
      "by",
      user && user.id,
    );
    const game = flipCard(gameID, card, user && user.id);
    console.log("new game:", game);
    io.to(`game-${gameID}`).emit("game-change", game);
  });
};

export const triggerFlipDelay = (game) => {
  game = clearFlippedCard(game);
  server.io.to(`game-${game.id}`).emit("game-change", game);
};
