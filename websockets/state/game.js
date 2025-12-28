import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js";
import * as LaravelAPI from "../services/laravel.js";

const games = new Map();
const gameTimers = new Map(); // Timers de animação (limpeza de mesa)
const turnTimers = new Map(); // NOVO: Timers de jogada (20s)

const TURN_LIMIT_MS = 20000; // 20 Segundos

let currentGameID = 0;

// --- FUNÇÕES AUXILIARES DO TIMER ---

const startTurnTimer = (gameId, io) => {
  // Limpa timer anterior se existir
  if (turnTimers.has(gameId)) {
    clearTimeout(turnTimers.get(gameId));
    turnTimers.delete(gameId);
  }

  const game = games.get(gameId);
  // Só inicia se o jogo existir, não tiver acabado e não estiver em pausa de ronda
  if (!game || game.gameOver || game.roundOver) return;

  // Inicia o timer
  const timer = setTimeout(async () => {
    const g = games.get(gameId);
    if (!g) return;

    console.log(`⏰ [State] Tempo esgotado para o Jogo ${gameId}`);

    // O jogador atual perde por tempo
    const loser = g.turn;

    // Chama a função que criaste no RegrasJogo/Game.js
    if (typeof g.resolveTimeout === "function") {
      await g.resolveTimeout(loser);
    } else {
      console.error("❌ Erro: resolveTimeout não existe em BiscaGame.");
      return;
    }

    // Notificar clientes do fim do jogo
    const room = `game-${g.id}`;
    io.to(room).emit("game_state", g.getState());

    // Limpar referência
    turnTimers.delete(gameId);
  }, TURN_LIMIT_MS);

  turnTimers.set(gameId, timer);
};

const stopTurnTimer = (gameId) => {
  if (turnTimers.has(gameId)) {
    clearTimeout(turnTimers.get(gameId));
    turnTimers.delete(gameId);
  }
};

// --- FIM FUNÇÕES AUXILIARES ---

export const createGame = async (
  gameType,
  user,
  mode = "singleplayer",
  winsNeeded = 1,
  isPractice = false,
) => {
  // VERIFICAÇÃO DE SEGURANÇA
  if (!user || !user.id || user.id === "loading") {
    console.error(`❌ [Game] Falha ao criar: User inválido`, user);
    return null;
  }

  currentGameID++;
  const gameID = currentGameID;
  const userToken = user.token;
  const BOT_ID = 0;

  // Forçar ID como string para evitar bugs
  user.id = String(user.id);

  const targetWins = parseInt(winsNeeded) || 1;
  const isMatch = targetWins > 1;
  const STAKE_VALUE = isMatch ? 10 : 0;

  console.log(
    `[State] Configurar Jogo ${gameID}. Target: ${targetWins}. É Campeonato? ${isMatch}. Multiplayer? ${mode === "multiplayer"}`,
  );

  let dbMatchId = null;

  if (isMatch && mode === "singleplayer" && !isPractice) {
    if (userToken) {
      const match = await LaravelAPI.createMatch(
        user,
        null, // Bot
        gameType,
        STAKE_VALUE,
        userToken,
      );

      if (match) {
        dbMatchId = match.id;
        console.log(`✅ [DB] Match criada (-10 coins): ID ${dbMatchId}`);
      } else {
        console.error(`❌ [State] Falha ao criar Match. Saldo insuficiente?`);
        return null;
      }
    }
  }

  let newGame = null;

  const dbCallbacks = {
    onGameStart: async () => {
      if (isPractice) return null;

      if (mode === "multiplayer") {
        if (!newGame || !newGame.player2) {
          console.log(
            `⏳ [State] Multiplayer: Jogo em memória. À espera de P2 para registar na BD.`,
          );
          return null;
        }
      }

      let gId = null;
      const p2Id =
        mode === "multiplayer" && newGame.player2 ? newGame.player2.id : null;

      if (isMatch && dbMatchId) {
        gId = await LaravelAPI.createGameForMatch(
          dbMatchId,
          user.id,
          p2Id,
          userToken,
        );
        console.log(
          ` 🔸 [DB] Game vinculado a Match ${dbMatchId} criado: ID ${gId}`,
        );
      } else {
        gId = await LaravelAPI.createStandaloneGame(
          user.id,
          p2Id,
          gameType,
          userToken,
        );
        console.log(
          ` 🔸 [DB] Game Solto criado: ID ${gId} (P1: ${user.id}, P2: ${p2Id || "Bot"})`,
        );
      }
      return gId;
    },

    onGameEnd: async (gameDbId, winnerSide, p1Points, p2Points) => {
      if (isPractice || !gameDbId) return;

      let realWinnerId = null;
      if (winnerSide === "player1") realWinnerId = user.id;
      else if (winnerSide === "player2") {
        realWinnerId =
          mode === "multiplayer" && newGame.player2
            ? newGame.player2.id
            : BOT_ID;
      }

      console.log(
        ` 🔹 [DB] A guardar pontos da ronda ${gameDbId}: ${p1Points}-${p2Points}`,
      );
      await LaravelAPI.finishGame(
        gameDbId,
        realWinnerId,
        p1Points,
        p2Points,
        userToken,
      );
    },

    onMatchEnd: async (
      winnerSide,
      p1Marks,
      p2Marks,
      p1TotalPoints,
      p2TotalPoints,
    ) => {
      if (isPractice || !isMatch || !dbMatchId) return;

      let realWinnerId = null;
      if (winnerSide === "player1") realWinnerId = user.id;
      else if (winnerSide === "player2") {
        realWinnerId =
          mode === "multiplayer" && newGame.player2
            ? newGame.player2.id
            : BOT_ID;
      }

      console.log(`🏆 [DB] A fechar Match ${dbMatchId}.`);
      await LaravelAPI.finishMatch(
        dbMatchId,
        realWinnerId,
        p1Marks,
        p2Marks,
        p1TotalPoints,
        p2TotalPoints,
        userToken,
      );
    },
  };

  newGame = new BiscaGame(gameType, mode, targetWins, dbCallbacks);
  newGame.dbMatchId = dbMatchId;

  await newGame.startNewMatch(true);

  newGame.id = gameID;
  newGame.creator = user.id;
  newGame.player1 = user;
  newGame.player2 = null;

  games.set(gameID, newGame);
  return newGame;
};

export const getGames = () =>
  Array.from(games.values())
    .filter((g) => !g.gameOver && !g.player2 && g.mode === "multiplayer")
    .map((g) => ({
      id: g.id,
      creator: g.player1.name,
      type: g.gameType === 9 ? "Bisca de 9" : "Bisca de 3",
    }));

export const getGame = (id) => games.get(id);

export const removeGame = (id) => {
  // Limpar timer de animação
  if (gameTimers.has(id)) {
    clearTimeout(gameTimers.get(id));
    gameTimers.delete(id);
  }
  // Limpar timer de turno
  stopTurnTimer(id);

  games.delete(id);
};

export const joinGame = async (id, user) => {
  const game = games.get(id);

  if (game && !game.player2) {
    const p1Id = String(game.player1.id);
    const userId = String(user.id);

    if (p1Id === userId) {
      console.warn(
        `⚠️ [State] Jogador ${user.name} tentou entrar no próprio jogo.`,
      );
      return null;
    }

    console.log(`👤 [State] Player 2 (${user.name}) entrou no Jogo ${id}`);

    user.id = userId;
    game.player2 = user;

    await game.startNewMatch(true);
    return game;
  }
  return null;
};

export const handlePlayerMove = (gameID, cardIndex, socketID) => {
  const game = games.get(gameID);
  if (!game) return null;
  const user = getUser(socketID);
  if (!user) return null;

  // PARAR O TIMER (Jogador tentou jogar)
  stopTurnTimer(gameID);

  let side = null;
  const userIdStr = String(user.id);

  if (String(game.player1.id) === userIdStr) side = "player1";
  else if (game.player2 && String(game.player2.id) === userIdStr)
    side = "player2";

  if (!side || game.tableCards.length >= 2) return { game, moveValid: false };

  const moveValid = game.playCard(side, cardIndex);

  // Se o movimento for inválido, tecnicamente o timer devia continuar ou reiniciar,
  // mas como o 'advanceGame' não é chamado em erro, o timer para.
  // Idealmente, se inválido, reativamos o timer no 'advanceGame' ou aqui.
  // Para simplificar: se inválido, o jogador tem de tentar de novo rápido (ou o front bloqueia).

  return { game, moveValid };
};

export const advanceGame = (id, io) => {
  const game = games.get(id);
  if (!game) return;

  // 1. Limpa timers de animação anteriores
  if (gameTimers.has(id)) {
    clearTimeout(gameTimers.get(id));
    gameTimers.delete(id);
  }

  // 2. Se o jogo acabou ou acabou a ronda (popup), parar relógio de turno
  if (game.roundOver || game.gameOver) {
    stopTurnTimer(id);
    return;
  }

  const room = `game-${game.id}`;

  // 3. Lógica de Jogo
  if (game.tableCards.length >= 2) {
    // Mesa cheia: Parar timer de turno, esperar animação
    stopTurnTimer(id);

    const timer = setTimeout(async () => {
      if (!games.get(id)) return;

      const winner = game.resolveRound();
      io.to(room).emit("game_state", game.getState());

      await game.cleanupRound(winner);
      io.to(room).emit("game_state", game.getState());

      // Recursivo: Próximo turno
      advanceGame(id, io);
    }, 1500);

    gameTimers.set(id, timer);
  } else if (!game.player2 && game.turn === "player2") {
    // Turno do BOT (Singleplayer): Bot joga rápido, sem timer de 20s
    stopTurnTimer(id); // Garante que não há timer a contar para o bot

    const timer = setTimeout(() => {
      if (!games.get(id)) return;
      if (game.roundOver || game.gameOver) return;

      game.playBotCard();
      io.to(room).emit("game_state", game.getState());
      advanceGame(id, io);
    }, 1000);

    gameTimers.set(id, timer);
  } else {
    // Turno de Jogador Humano: INICIAR TIMER DE 20s
    startTurnTimer(id, io);
  }
};
