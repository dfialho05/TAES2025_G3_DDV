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

});
