import { BiscaGame } from "../RegrasJogo/SinglePlayer.js";

// Armazena os jogos: socket.id -> Instância de SinglePlayerGame
const games = new Map();

export const connectionsHandlers = (io) => {
  
  io.on("connection", (socket) => {
    console.log(`🔌 Jogador conectado: ${socket.id}`);

    // --- EVENTOS ---

    // 1. Iniciar Jogo
    socket.on("join_game", () => {
      // Cria uma NOVA instância do jogo para este jogador
      const newGame = new BiscaGame();
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
            handleBotTurn(socket);
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

function handleBotTurn(socket) {
    const game = games.get(socket.id);
    if (!game) return;

    // Bot joga
    game.playBotCard();
    const winner = game.resolveRound(); // Calcula quem ganhou
    emitGameState(socket); // Mostra as duas cartas na mesa e o resultado

    // Limpa a mesa após 1.5s
    setTimeout(() => {
        // Verificação extra caso o jogador tenha saído entretanto
        if (!games.has(socket.id)) return;
        
        game.cleanupRound(winner);
        emitGameState(socket);
    }, 1500);
}

function emitGameState(socket) {
    const game = games.get(socket.id);
    if (game) {
        socket.emit("game_state", game.getState());
    }
}