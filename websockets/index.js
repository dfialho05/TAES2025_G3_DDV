import { Server } from "socket.io";
import { GameManager } from "./GameManager.js";

const io = new Server(3000, { cors: { origin: "*" } });
const manager = new GameManager();

io.on("connection", (socket) => {
  console.log("🧩 Novo jogador conectado");

  socket.on("startGame", ({ playerName, opponentName }) => {
    const { gameId, game } = manager.createGame(playerName, opponentName);
    socket.join(gameId);

    io.to(gameId).emit("gameStarted", {
      gameId,
      state: game.getState(), // 👈 envia cartas
    });
  });

  socket.on("playCard", ({ player, card, gameId }) => {
    const game = manager.activeGames.get(gameId);
    if (!game) return;

    game.playCard(player, new Card(card.suit, card.cardFigure));

    io.to(gameId).emit("updateState", game.getState()); // 👈 atualiza no frontend
  });
});
