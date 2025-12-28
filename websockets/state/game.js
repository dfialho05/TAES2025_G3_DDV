import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js";
import * as LaravelAPI from "../services/laravel.js";

// Helper function to emit balance update to a user
const emitBalanceUpdate = async (io, userId, token) => {
  if (!token || userId === 0) return; // Skip for BOT or users without token

  try {
    const balance = await LaravelAPI.getUserBalance(token);
    if (balance !== null) {
      // Emit to all sockets of this user
      io.emit("balance_update", { userId, balance });
      console.log(`💰 [Balance] Updated for user ${userId}: ${balance} coins`);
    }
  } catch (error) {
    console.error(
      `❌ [Balance] Error updating for user ${userId}:`,
      error.message,
    );
  }
};

const games = new Map();
const gameTimers = new Map(); // Timers de animação (limpeza de mesa)
const turnTimers = new Map(); // NOVO: Timers de jogada (20s)

const TURN_LIMIT_MS = 20000; // 20 Segundos

let currentGameID = 0;

export const getRawGames = () => games;
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
  const STAKE_VALUE = isMatch ? 10 : 2; // Matches = 10 coins, Games = 2 coins

  console.log(
    `[State] Configurar Jogo ${gameID}. Target: ${targetWins}. É Campeonato? ${isMatch}. Multiplayer? ${mode === "multiplayer"}`,
  );

  let dbMatchId = null;

  // Criar match na BD APENAS para singleplayer (vs BOT)
  // Para multiplayer, a match será criada quando P2 entrar
  if (isMatch && mode === "singleplayer" && !isPractice) {
    if (userToken) {
      const match = await LaravelAPI.createMatch(
        user,
        null, // BOT
        gameType,
        STAKE_VALUE,
        userToken,
      );

      if (match) {
        dbMatchId = match.id;
        console.log(`✅ [DB] Match vs BOT criada (Pending): ID ${dbMatchId}`);
        // Note: Entry fees will be charged when first game starts
      } else {
        console.error(`❌ [State] Falha ao criar Match vs BOT.`);
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

      // Usar newGame.dbMatchId que pode ter sido definido no joinGame
      const currentDbMatchId = newGame.dbMatchId || dbMatchId;

      console.log(`🔍 [onGameStart] Callback chamado:`);
      console.log(`   Mode: ${mode}`);
      console.log(`   P2 presente: ${newGame.player2 ? "SIM" : "NÃO"}`);
      console.log(`   P2 ID: ${p2Id || "NULL"}`);
      console.log(`   isMatch: ${isMatch}`);
      console.log(`   dbMatchId (local): ${dbMatchId || "NULL"}`);
      console.log(`   newGame.dbMatchId: ${newGame.dbMatchId || "NULL"}`);
      console.log(`   currentDbMatchId (usado): ${currentDbMatchId || "NULL"}`);

      if (isMatch && currentDbMatchId) {
        gId = await LaravelAPI.createGameForMatch(
          currentDbMatchId,
          user.id,
          p2Id,
          userToken,
        );
        console.log(
          ` 🔸 [DB] Game vinculado a Match ${currentDbMatchId} criado: ID ${gId}`,
        );
        console.log(
          `   ⚠️ Este game faz parte de uma MATCH - entry fees serão de 10 coins cada`,
        );

        // For multiplayer matches: DON'T charge here in onGameStart
        // Entry fees will be charged in joinGame when P2 enters (first time only)
        // onGameStart is called for EACH game in the match, not just the first one
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
        console.log(`   ℹ️ Game standalone - entry fees serão de 2 coins cada`);

        // For standalone multiplayer games: DON'T charge here
        // Entry fees will be charged in joinGame when P2 enters

        // For standalone games vs BOT, start immediately and charge entry fees
        if (p2Id === null || p2Id === 0) {
          const startResult = await LaravelAPI.startGame(gId, userToken);
          if (startResult) {
            console.log(
              `✅ [DB] Standalone game vs BOT iniciado - Entry fee cobrada`,
            );

            // Emit balance update for player
            if (global.io) {
              await emitBalanceUpdate(global.io, user.id, userToken);
            }
          }
        }
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

      // Para jogos standalone (não match), emitir atualização de balance
      if (!isMatch && global.io && mode === "multiplayer") {
        // Atualizar balance do vencedor
        if (realWinnerId && realWinnerId !== 0) {
          const winner =
            realWinnerId === user.id ? user : newGame.player2 || null;
          if (winner && winner.token) {
            await emitBalanceUpdate(global.io, winner.id, winner.token);
          }
        }

        // Atualizar balance do perdedor também
        const loserId =
          realWinnerId === user.id
            ? newGame.player2
              ? newGame.player2.id
              : null
            : user.id;
        const loser = loserId === user.id ? user : newGame.player2;

        if (loser && loser.token && loserId !== 0) {
          await emitBalanceUpdate(global.io, loserId, loser.token);
        }
      }
    },

    onMatchEnd: async (
      winnerSide,
      p1Marks,
      p2Marks,
      p1TotalPoints,
      p2TotalPoints,
    ) => {
      console.log(`🔍 [onMatchEnd] Callback chamado:`);
      console.log(`   isPractice: ${isPractice}`);
      console.log(`   isMatch: ${isMatch}`);
      console.log(`   dbMatchId (local): ${dbMatchId || "NULL"}`);
      console.log(`   newGame.dbMatchId: ${newGame.dbMatchId || "NULL"}`);
      console.log(`   winnerSide: ${winnerSide}`);

      // Usar newGame.dbMatchId que foi definido no joinGame para multiplayer
      const currentDbMatchId = newGame.dbMatchId || dbMatchId;

      if (isPractice || !isMatch || !currentDbMatchId) {
        console.log(
          `⚠️ [onMatchEnd] Callback cancelado (practice ou não é match ou sem matchId)`,
        );
        return;
      }

      let realWinnerId = null;
      if (winnerSide === "player1") realWinnerId = user.id;
      else if (winnerSide === "player2") {
        realWinnerId =
          mode === "multiplayer" && newGame.player2
            ? newGame.player2.id
            : BOT_ID;
      }

      console.log(`🏆 [DB] A fechar Match ${currentDbMatchId}.`);
      console.log(`   Vencedor: ${realWinnerId}`);
      console.log(`   P1 Marks: ${p1Marks}, P2 Marks: ${p2Marks}`);
      await LaravelAPI.finishMatch(
        currentDbMatchId,
        realWinnerId,
        p1Marks,
        p2Marks,
        p1TotalPoints,
        p2TotalPoints,
        userToken,
      );

      console.log(`✅ [DB] Match ${currentDbMatchId} finalizada.`);

      // Emit balance updates for both players after match finish (winner receives payout)
      console.log(`💰 [onMatchEnd] Emitindo balance updates...`);
      if (global.io) {
        // Update winner balance
        if (realWinnerId && realWinnerId !== 0) {
          const winner =
            realWinnerId === user.id ? user : newGame.player2 || null;
          if (winner && winner.token) {
            console.log(
              `   Atualizando balance do vencedor: ${winner.id} (${winner.name})`,
            );
            await emitBalanceUpdate(global.io, winner.id, winner.token);
          }
        }

        // Update loser balance too (to reflect any changes)
        const loserId =
          realWinnerId === user.id
            ? newGame.player2
              ? newGame.player2.id
              : null
            : user.id;
        const loser = loserId === user.id ? user : newGame.player2;

        if (loser && loser.token && loserId !== 0) {
          console.log(
            `   Atualizando balance do perdedor: ${loserId} (${loser ? loser.name : "N/A"})`,
          );
          await emitBalanceUpdate(global.io, loserId, loser.token);
        }
      } else {
        console.error(`❌ [onMatchEnd] global.io não está disponível!`);
      }
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

    // Se for match multiplayer, criar a match na BD ANTES de startNewMatch
    const isMatch = game.winsNeeded > 1;

    console.log(`🔍 [Debug joinGame] Verificando se deve criar match:`);
    console.log(`   game.winsNeeded: ${game.winsNeeded}`);
    console.log(`   isMatch (winsNeeded > 1): ${isMatch}`);
    console.log(`   game.mode: ${game.mode}`);
    console.log(`   game.dbMatchId: ${game.dbMatchId || "NULL"}`);
    console.log(
      `   Condição final: ${isMatch && game.mode === "multiplayer" && !game.dbMatchId}`,
    );

    if (isMatch && game.mode === "multiplayer" && !game.dbMatchId) {
      console.log(`📝 [State] Criando Match multiplayer na BD (P2 entrou)...`);
      const p1Token = game.player1.token;

      const match = await LaravelAPI.createMatch(
        game.player1,
        user, // P2
        game.gameType,
        10, // MATCH_STAKE
        p1Token,
      );

      if (match) {
        game.dbMatchId = match.id;
        console.log(`✅ [DB] Match Multiplayer criada: ID ${game.dbMatchId}`);
      } else {
        console.error(`❌ [State] Falha ao criar Match multiplayer.`);
        return null;
      }
    }

    // startNewMatch DEPOIS de criar a match para que dbMatchId já exista
    await game.startNewMatch(true);

    console.log(`🔍 [State] Após startNewMatch:`);
    console.log(`   dbCurrentGameId: ${game.dbCurrentGameId || "NULL"}`);
    console.log(`   dbMatchId: ${game.dbMatchId || "NULL"}`);
    console.log(`   mode: ${game.mode}`);
    console.log(`   winsNeeded: ${game.winsNeeded}`);
    console.log(`   isMatch: ${isMatch}`);

    // Cobrar entry fees agora que P2 entrou
    const isStandaloneMultiplayer =
      !game.dbMatchId && game.mode === "multiplayer";
    const isMatchMultiplayer = game.dbMatchId && game.mode === "multiplayer";

    console.log(`   isStandaloneMultiplayer: ${isStandaloneMultiplayer}`);
    console.log(`   isMatchMultiplayer: ${isMatchMultiplayer}`);

    if (isStandaloneMultiplayer && game.dbCurrentGameId) {
      console.log(
        `💰 [State] P2 entrou - Cobrando entry fees (2 coins cada) para standalone game ${game.dbCurrentGameId}`,
      );
      console.log(`   P1: ${game.player1.id} (${game.player1.name})`);
      console.log(`   P2: ${user.id} (${user.name})`);

      const p1Token = game.player1.token;
      const p2Token = user.token;

      console.log(`   P1 Token: ${p1Token ? "presente" : "AUSENTE"}`);
      console.log(`   P2 Token: ${p2Token ? "presente" : "AUSENTE"}`);

      // Start the game which triggers entry fee charging
      const startResult = await LaravelAPI.startGame(
        game.dbCurrentGameId,
        p1Token,
      );

      console.log(`   Start Result:`, startResult ? "SUCCESS" : "FAILED");

      if (startResult) {
        console.log(
          `✅ [State] Entry fees (2 coins cada) cobradas de ambos os jogadores`,
        );

        // Emit balance updates for both players
        if (global.io) {
          if (p1Token) {
            await emitBalanceUpdate(global.io, game.player1.id, p1Token);
          }
          if (p2Token && !user.isBot && userId !== "0") {
            await emitBalanceUpdate(global.io, userId, p2Token);
          }
        }
      } else {
        console.error(
          `❌ [State] Falha ao cobrar entry fees do standalone game. Saldo insuficiente?`,
        );
      }
    } else if (isMatchMultiplayer && game.dbMatchId) {
      console.log(
        `💰 [State] P2 entrou - Cobrando entry fees (10 coins cada) para match ${game.dbMatchId}`,
      );
      console.log(`   P1: ${game.player1.id} (${game.player1.name})`);
      console.log(`   P2: ${user.id} (${user.name})`);

      const p1Token = game.player1.token;
      const p2Token = user.token;

      console.log(`   P1 Token: ${p1Token ? "presente" : "AUSENTE"}`);
      console.log(`   P2 Token: ${p2Token ? "presente" : "AUSENTE"}`);

      // Start the match which triggers entry fee charging
      const startResult = await LaravelAPI.startMatch(game.dbMatchId, p1Token);

      console.log(`   Start Result:`, startResult ? "SUCCESS" : "FAILED");

      if (startResult) {
        console.log(
          `✅ [State] Entry fees (10 coins cada) cobradas de ambos os jogadores`,
        );

        // Emit balance updates for both players
        if (global.io) {
          if (p1Token) {
            await emitBalanceUpdate(global.io, game.player1.id, p1Token);
          }
          if (p2Token && !user.isBot && userId !== "0") {
            await emitBalanceUpdate(global.io, userId, p2Token);
          }
        }
      } else {
        console.error(
          `❌ [State] Falha ao cobrar entry fees da match. Saldo insuficiente?`,
        );
      }
    }

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
