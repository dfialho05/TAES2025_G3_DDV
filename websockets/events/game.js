import * as GameState from "../state/game.js";
import * as ConnectionState from "../state/connections.js";

export const gameHandlers = (io, socket) => {
  socket.on("get-games", () => socket.emit("games", GameState.getGames()));

  socket.on("create-game", async (gameType, mode, targetWins, isPractice) => {
    const user = ConnectionState.getUser(socket.id);
    if (!user) {
        console.error(`❌ [Game] Falha ao criar: Socket ${socket.id} não identificado.`);
        return;
    }

    const game = await GameState.createGame(
      gameType,
      user,
      mode || "singleplayer",
      targetWins || 1,
      isPractice || false,
    );

    if (game) {
        socket.join(`game-${game.id}`);
        console.log(
          `[Game] Criado jogo ${game.id} por ${user.name}${isPractice ? " (PRACTICE)" : ""}`,
        );

        socket.emit("game-joined", game.getState());

        // NOVO: Iniciar fluxo (inicia o timer do P1 imediatamente)
        GameState.advanceGame(game.id, io);

        io.emit("games", GameState.getGames());
    }
  });

  socket.on("play_card", (data) => {
    const result = GameState.handlePlayerMove(
      data.gameID,
      data.cardIndex,
      socket.id,
    );
    if (result && result.moveValid) {
      const game = result.game;
      io.to(`game-${game.id}`).emit("game_state", game.getState());
      GameState.advanceGame(game.id, io);
    }
  });

  socket.on("join-game", async (gid) => { 
    const user = ConnectionState.getUser(socket.id);
    
    const game = await GameState.joinGame(gid, user); 
    
    if (game) {
      socket.join(`game-${gid}`);
      
      // Envia estado atualizado para a sala (agora com o Player 2)
      io.to(`game-${gid}`).emit("game_state", game.getState());
      
      // NOVO: O jogo recomeçou/baralhou ao entrar o P2. 
      // Precisamos chamar advanceGame para iniciar o timer do primeiro jogador.
      GameState.advanceGame(gid, io);

      // Atualiza a lista no lobby
      io.emit("games", GameState.getGames());
    }
  });

  socket.on("leave_game", (gid) => {
    socket.leave(`game-${gid}`);
    // Opcional: GameState.removePlayer(gid, socket.id);
  });

  socket.on("next_round", (gid) => {
    const game = GameState.getGame(gid);
    if (game) {
      if (game.gameOver) return;

      console.log(`[Game] Next Round solicitado para Jogo ${gid}`);
      game.confirmNextRound(); 

      io.to(`game-${gid}`).emit("game_state", game.getState());
      
      // Reinicia o fluxo (e o timer) para a nova ronda
      GameState.advanceGame(gid, io);
    }
  });
};