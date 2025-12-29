import * as GameState from "../state/game.js";
import * as ConnectionState from "../state/connections.js";

// --- FUNÇÃO AUXILIAR: PROCESSAR DESISTÊNCIA ---
// Serve tanto para quando clicam em "Sair" como para quando fecham o browser
const handleGameForfeit = async (io, socket, specificGameId = null) => {
  const user = ConnectionState.getUser(socket.id);
  if (!user) return;

  let targetGame = null;

  if (specificGameId) {
    // Se veio do botão "Sair", já sabemos o ID
    targetGame = GameState.getGame(specificGameId);
  } else {
    // Se veio do "Disconnect" (fechar aba), temos de procurar onde ele estava
    // Usamos a função getRawGames que exportaste no state/game.js
    const allGames = GameState.getRawGames();

    for (const game of allGames.values()) {
      if (game.gameOver) continue;

      // Verifica se o user é P1 ou P2 neste jogo
      // Convertemos para String para garantir que a comparação funciona
      const p1Id = game.player1 ? String(game.player1.id) : null;
      const p2Id = game.player2 ? String(game.player2.id) : null;
      const userId = String(user.id);

      if (p1Id === userId || p2Id === userId) {
        targetGame = game;
        break; // Encontrámos o jogo ativo
      }
    }
  }

  // Se encontrámos um jogo ativo e ele ainda não acabou
  if (targetGame && !targetGame.gameOver) {
    // Descobrir qual lado (player1 ou player2) desistiu
    const p1Id = targetGame.player1 ? String(targetGame.player1.id) : null;
    const userId = String(user.id);

    const side = p1Id === userId ? "player1" : "player2";

    console.log(
      ` [Game] ${user.name} (${side}) abandonou a partida (ID: ${targetGame.id}). Aplicando derrota.`,
    );

    // Chama a mesma função do Tempo Esgotado (que passa tudo para o oponente)
    await targetGame.resolveTimeout(side);

    // Notifica a sala (o adversário recebe o popup de vitória)
    io.to(`game-${targetGame.id}`).emit("game_state", targetGame.getState());

    // Atualiza o lobby (para remover o jogo da lista ou atualizar status)
    io.emit("games", GameState.getGames());
  }
};

export const gameHandlers = (io, socket) => {
  // 1. O user fechou o browser ou fez refresh
  socket.on("disconnect", async () => {
    await handleGameForfeit(io, socket);
  });

  // 2. O user clicou em "Sair" ou "Voltar"
  socket.on("leave_game", async (gid) => {
    socket.leave(`game-${gid}`);
    await handleGameForfeit(io, socket, gid);
  });

  socket.on("get-games", () => socket.emit("games", GameState.getGames()));

  socket.on("create-game", async (gameType, mode, targetWins, isPractice) => {
    const user = ConnectionState.getUser(socket.id);
    if (!user) {
      console.error(
        ` [Game] Falha ao criar: Socket ${socket.id} não identificado.`,
      );
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

      // Iniciar fluxo
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

      io.to(`game-${gid}`).emit("game_state", game.getState());

      // Iniciar fluxo ao entrar P2
      GameState.advanceGame(gid, io);

      io.emit("games", GameState.getGames());
    }
  });

  socket.on("next_round", (gid) => {
    const game = GameState.getGame(gid);
    if (game) {
      if (game.gameOver) return;

      console.log(`[Game] Next Round solicitado para Jogo ${gid}`);
      game.confirmNextRound();

      io.to(`game-${gid}`).emit("game_state", game.getState());
      GameState.advanceGame(gid, io);
    }
  });
};
