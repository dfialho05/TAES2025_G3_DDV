import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js";
import * as LaravelAPI from "../services/laravel.js";

const games = new Map();
// Mapa para impedir loops duplicados (timers fantasmas)
const gameTimers = new Map();

let currentGameID = 0;

export const createGame = async (
  gameType,
  user,
  mode = "singleplayer",
  winsNeeded = 1,
  isPractice = false,
) => {
  currentGameID++;
  const gameID = currentGameID;
  const userToken = user.token;
  const BOT_ID = 9999;

  const targetWins = parseInt(winsNeeded) || 1;
  const isMatch = targetWins > 1;
  const STAKE_VALUE = isMatch ? 10 : 0;

  console.log(
    `[State] Configurar Jogo ${gameID}. Target: ${targetWins}. É Campeonato? ${isMatch}. Practice? ${isPractice}`,
  );

  let dbMatchId = null;

  // Configura Match na BD (apenas se não for practice)
  if (isMatch && mode === "singleplayer" && !isPractice) {
    if (userToken) {
      // AQUI ESTÁ A MUDANÇA: Passamos STAKE_VALUE (10)
      const match = await LaravelAPI.createMatch(
        user,
        null,
        gameType,
        STAKE_VALUE,
        userToken,
      );

      if (match) {
        dbMatchId = match.id;
        console.log(`✅ [DB] Match criada (-10 coins): ID ${dbMatchId}`);
      } else {
        // SEGURANÇA CRÍTICA:
        // Se a API retornar null (ex: utilizador sem saldo suficiente),
        // abortamos a criação do jogo imediatamente.
        console.error(
          `❌ [State] Falha ao criar Match. Provavelmente saldo insuficiente.`,
        );
        return null;
      }
    } else {
      // Se for campeonato mas o user não tiver token (não logado), aborta.
      console.error(`❌ [State] Tentativa de jogar a dinheiro sem login.`);
      return null;
    }
  } else if (isPractice) {
    console.log(`📚 [Practice] Jogo de treino - não será guardado na BD`);
  }

  const dbCallbacks = {
    onGameStart: async () => {
      // Se for practice, não salva na BD
      if (isPractice) {
        console.log(`   📚 [Practice] Não criando game na BD (practice mode)`);
        return null;
      }

      let gId = null;
      if (isMatch && dbMatchId) {
        gId = await LaravelAPI.createGameForMatch(
          dbMatchId,
          user.id,
          null,
          userToken,
        );
        console.log(
          `   🔸 [DB] Game vinculado a Match ${dbMatchId} criado: ID ${gId}`,
        );
      } else {
        gId = await LaravelAPI.createStandaloneGame(
          user.id,
          null,
          gameType,
          userToken,
        );
        console.log(`   🔸 [DB] Game Solto (Rápido) criado: ID ${gId}`);
      }
      return gId;
    },

    onGameEnd: async (gameDbId, winnerSide, p1Points, p2Points) => {
      // Se for practice ou não há gameDbId, não salva na BD
      if (isPractice || !gameDbId) {
        if (isPractice) {
          console.log(
            `   📚 [Practice] Não guardando resultados da ronda (practice mode)`,
          );
        }
        return;
      }

      let realWinnerId = null;
      if (winnerSide === "player1") realWinnerId = user.id;
      else if (winnerSide === "player2") realWinnerId = BOT_ID;

      console.log(
        `   🔹 [DB] A guardar pontos da ronda ${gameDbId}: ${p1Points}-${p2Points}`,
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
      // Se for practice, não salva na BD
      if (isPractice) {
        console.log(
          `📚 [Practice] Não guardando resultados da partida (practice mode)`,
        );
        return;
      }

      if (!isMatch || !dbMatchId) return;

      let realWinnerId = null;
      if (winnerSide === "player1") realWinnerId = user.id;
      else if (winnerSide === "player2") realWinnerId = BOT_ID;

      console.log(`🏆 [DB] A fechar Match ${dbMatchId}.`);
      console.log(
        `   Resultados: P1(${p1Marks} marks, ${p1TotalPoints} pts) vs Bot(${p2Marks} marks, ${p2TotalPoints} pts)`,
      );

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

  const newGame = new BiscaGame(gameType, mode, targetWins, dbCallbacks);
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
    .map((g) => ({ id: g.id, creator: g.player1.name }));
export const getGame = (id) => games.get(id);

export const removeGame = (id) => {
  // Limpar timer ao remover jogo para evitar erros de memória
  if (gameTimers.has(id)) {
    clearTimeout(gameTimers.get(id));
    gameTimers.delete(id);
  }
  games.delete(id);
};

export const joinGame = (id, user) => {
  const game = games.get(id);
  if (game && !game.player2) {
    game.player2 = user;
    return game;
  }
  return null;
};

export const handlePlayerMove = (gameID, cardIndex, socketID) => {
  const game = games.get(gameID);
  if (!game) return null;
  const user = getUser(socketID);
  if (!user) return null;
  let side = null;
  if (String(game.player1.id) === String(user.id)) side = "player1";
  else if (game.player2 && String(game.player2.id) === String(user.id))
    side = "player2";
  if (!side || game.tableCards.length >= 2) return { game, moveValid: false };
  return { game, moveValid: game.playCard(side, cardIndex) };
};

// --- FUNÇÃO CORRIGIDA DE LOOP DO JOGO ---
export const advanceGame = (id, io) => {
  const game = games.get(id);
  if (!game) return;

  // 1. Limpar timers antigos
  if (gameTimers.has(id)) {
    clearTimeout(gameTimers.get(id));
    gameTimers.delete(id);
  }

  // 2. Se a ronda acabou ou o jogo acabou, PÁRA O LOOP.
  if (game.roundOver || game.gameOver) return;

  const room = `game-${game.id}`;

  if (game.tableCards.length >= 2) {
    // Resolver a vaza com delay visual
    const timer = setTimeout(async () => {
      if (!games.get(id)) return;

      const winner = game.resolveRound();
      io.to(room).emit("game_state", game.getState());

      // 3. AWAIT ESSENCIAL: Espera processamento e BD
      await game.cleanupRound(winner);

      // Emite estado atualizado (se roundOver for true, o front mostra popup)
      io.to(room).emit("game_state", game.getState());

      // Tenta avançar. Se roundOver=true, o próximo loop cancela-se na linha "if(game.roundOver) return"
      advanceGame(id, io);
    }, 1500);

    gameTimers.set(id, timer);
  } else if (!game.player2 && game.turn === "player2") {
    // Turno do Bot
    const timer = setTimeout(() => {
      if (!games.get(id)) return;
      // Verificação extra de segurança
      if (game.roundOver || game.gameOver) return;

      game.playBotCard();
      io.to(room).emit("game_state", game.getState());
      advanceGame(id, io);
    }, 1000);

    gameTimers.set(id, timer);
  }
};
