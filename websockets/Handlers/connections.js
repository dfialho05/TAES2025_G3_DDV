import { BiscaGame } from "../RegrasJogo/SinglePlayer.js";

// Armazena os jogos: socket.id -> Instância de SinglePlayerGame

const games = new Map();

export const connectionsHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Jogador conectado: ${socket.id}`);

    // --- EVENTOS ---

    // 1. Iniciar Jogo

    socket.on("join_game", (gameType) => {
      // Cria uma NOVA instância do jogo para este jogador

      console.log(`🎮 Novo Jogo Criado: Bisca de ${gameType || 3} para ${socket.id}`);

      // Passamos o gameType para o construtor da classe
      const newGame = new BiscaGame(gameType);

      games.set(socket.id, newGame);

      emitGameState(socket);
    });

    // 2. Jogada do Jogador

    socket.on("play_card", (cardIndex) => {
      const game = games.get(socket.id);

      if (!game) return;

      // Tenta jogar a carta

      const moveValid = game.playUserCard(cardIndex);

      if (moveValid) {
        emitGameState(socket); // Atualiza UI (carta na mesa)

        // Agenda a resposta do Bot

        setTimeout(() => {
          handleBotLoop(socket);
        }, 1000);
      }
    });

    // 3. Desconexão

    socket.on("disconnect", () => {
      console.log(`❌ Jogador saiu: ${socket.id}`);

      games.delete(socket.id); // Limpa a memória
    });
  });
};

// --- FUNÇÕES AUXILIARES DO HANDLER ---

function handleBotLoop(socket) {
  const game = games.get(socket.id);

  // Verificação extra: se game não existe (user saiu) ou jogo acabou, pára.

  if (!game || game.gameOver) return;

  // 1. O Bot joga se a mesa AINDA NÃO estiver cheia

  if (game.tableCards.length < 2) {
    game.playBotCard();

    emitGameState(socket); // Envia estado logo após bot jogar
  }

  // 2. Verificamos se a ronda acabou (já há 2 cartas na mesa?)

  if (game.tableCards.length === 2) {
    // 3. Resolve a vaza

    const winner = game.resolveRound();

    emitGameState(socket); // Mostra o resultado da vaza (quem ganhou)

    // 4. Limpeza e Próximo Turno

    setTimeout(() => {
      // Segurança: User pode ter desconectado durante o delay

      if (!games.has(socket.id)) return;

      game.cleanupRound(winner);

      emitGameState(socket); // Mesa limpa, novas cartas

      // 5. LOOP: Se o Bot ganhou a vaza, ele joga outra vez!

      if (game.turn === "bot" && !game.gameOver) {
        setTimeout(() => {
          handleBotLoop(socket);
        }, 1000);
      }
    }, 1500);
  }
}

function emitGameState(socket) {
  const game = games.get(socket.id);

  if (game) {
    socket.emit("game_state", game.getState());
  }
}
