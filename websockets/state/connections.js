// websockets/state/connections.js
import { BiscaGame } from "../RegrasJogo/Game.js"; // Ajusta o caminho conforme necessário

// 1. O Estado (Dados) fica aqui
const games = new Map();
const users = new Map();

// --- FUNÇÕES DE LÓGICA (EXPORTADAS) ---

export const createGame = (socket, gameType) => {
  console.log(
    `🎮 Novo Jogo Criado: Bisca de ${gameType || 3} para ${socket.id}`
  );
  const newGame = new BiscaGame(gameType);
  games.set(socket.id, newGame);
  emitGameState(socket);
};

export const handlePlayerMove = (socket, cardIndex) => {
  const game = games.get(socket.id);
  if (!game) return;

  const moveValid = game.playUserCard(cardIndex);

  if (moveValid) {
    emitGameState(socket); // Atualiza UI

    // Agenda resposta do Bot
    setTimeout(() => {
      handleBotLoop(socket);
    }, 1000);
  }
};

export const removeGame = (socket) => {
  console.log(`❌ Jogador saiu: ${socket.id}`);
  games.delete(socket.id);
};

// --- FUNÇÕES AUXILIARES INTERNAS (Lógica do Bot e Emissão) ---

// Esta função precisa estar aqui porque ela lê e altera o estado (game)
function handleBotLoop(socket) {
  const game = games.get(socket.id);

  if (!game || game.gameOver) return;

  // 1. Bot joga
  if (game.tableCards.length < 2) {
    game.playBotCard();
    emitGameState(socket);
  }

  // 2. Verifica fim da ronda
  if (game.tableCards.length === 2) {
    const winner = game.resolveRound();
    emitGameState(socket);

    // 3. Limpeza e Próximo Turno
    setTimeout(() => {
      if (!games.has(socket.id)) return; // Segurança

      game.cleanupRound(winner);
      emitGameState(socket);

      // Loop recursivo se for a vez do bot novamente
      if (game.turn === "bot" && !game.gameOver) {
        setTimeout(() => {
          handleBotLoop(socket);
        }, 1000);
      }
    }, 1500);
  }
}

// O emit fica aqui porque só o STATE sabe o estado atual do jogo
function emitGameState(socket) {
  const game = games.get(socket.id);
  if (game) {
    socket.emit("game_state", game.getState());
  }
}

// --- FUNÇOES DOS USERS ---
export const addUser = (socket, user) => {
  users.set(socket.id, user);
};

export const removeUser = (socketID) => {
  const userToDelete = { ...users.get(socketID) };
  users.delete(socketID);
  return userToDelete;
};

export const getUser = (socketID) => {
  return users.get(socketID);
};

export const getUserCount = () => {
  return users.size;
};
