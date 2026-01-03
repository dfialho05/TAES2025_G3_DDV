import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";
const BOT_ID = 0;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 5000,
});

async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {};
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    const response = await apiClient({
      method,
      url: endpoint,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(` Laravel Error [${endpoint}]:`, error.response.data);
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data sent:`, data);
    } else {
      console.error(` Network/Axios Error [${endpoint}]:`, error.message);
    }
    return null;
  }
}

// 1. Criar MATCH (Sessão)
export const createMatch = async (player1, player2, type, stake = 0, token) => {
  const p2Id = player2 ? player2.id : BOT_ID;
  const body = {
    type: type,
    status: "Pending", // Changed from "Playing" - will start when both players ready
    player1_user_id: player1.id,
    player2_user_id: p2Id,
    stake: stake,
    player1_marks: 0,
    player2_marks: 0,
  };
  const result = await apiCall("POST", "/matches", body, token);
  return result ? result : null;
};

// Start a match (charges entry fees from both players)
export const startMatch = async (matchId, token) => {
  return await apiCall("POST", `/matches/${matchId}/start`, {}, token);
};

// 2. Finalizar MATCH
export const finishMatch = async (
  matchId,
  winnerId,
  p1Marks,
  p2Marks,
  p1Points,
  p2Points,
  token,
) => {
  const finalP1Marks = Math.min(p1Marks, 4);
  const finalP2Marks = Math.min(p2Marks, 4);

  const body = {
    winner_user_id: winnerId,
    player1_marks: finalP1Marks,
    player2_marks: finalP2Marks,
    player1_points: p1Points,
    player2_points: p2Points,
  };
  return await apiCall("POST", `/matches/${matchId}/finish`, body, token);
};

// 3. Criar JOGO SOLTO (Standalone)
export const createStandaloneGame = async (
  player1Id,
  player2Id,
  type,
  token,
) => {
  const p2Id = player2Id || BOT_ID;
  const body = {
    match_id: null,
    type: type,
    status: "Playing",
    player1_points: 0,
    player2_points: 0,
    player1_user_id: player1Id,
    player2_user_id: p2Id,
  };
  const result = await apiCall("POST", "/games", body, token);
  return result ? result.id : null;
};

// 4. Criar JOGO VINCULADO (Dentro de uma Match)
export const createGameForMatch = async (
  matchId,
  player1Id,
  player2Id,
  token,
) => {
  const p2Id = player2Id || BOT_ID;
  const body = {
    status: "Playing",
    player1_points: 0,
    player2_points: 0,
    player1_user_id: player1Id,
    player2_user_id: p2Id,
  };
  const result = await apiCall(
    "POST",
    `/matches/${matchId}/games`,
    body,
    token,
  );
  return result ? result.id : null;
};

// 5. Finalizar Jogo Individual
export const finishGame = async (
  gameId,
  winnerId,
  p1Points,
  p2Points,
  token,
) => {
  const body = {
    winner_user_id: winnerId,
    player1_points: p1Points,
    player2_points: p2Points,
  };
  return await apiCall("POST", `/games/${gameId}/finish`, body, token);
};

// 6. Start a game (charges entry fees for standalone games)
export const startGame = async (gameId, token) => {
  return await apiCall("POST", `/games/${gameId}/start`, {}, token);
};

// 7. Obter saldo atualizado do utilizador
export const getUserBalance = async (token) => {
  const result = await apiCall("GET", "/users/me", null, token);
  return result ? result.data.coins_balance : null;
};

// 8. Obter informações completas do utilizador
export const getUserInfo = async (token) => {
  const result = await apiCall("GET", "/users/me", null, token);
  return result ? result.data : null;
};

// 9. Reembolsar moedas ao utilizador
export const refundCoins = async (userId, amount, token, metadata = {}) => {
  const body = {
    user_id: userId,
    amount: amount,
    reason: metadata.reason || "Game timeout/cancellation",
    game_id: metadata.game_id || null,
    timestamp: metadata.timestamp || new Date().toISOString(),
  };

  console.log(
    `[Laravel] Solicitando reembolso de ${amount} coins para user ${userId}`,
  );
  const result = await apiCall("POST", "/refund", body, token);

  if (result) {
    console.log(
      `[Laravel] Reembolso concluído com sucesso para user ${userId}`,
    );
    return result;
  } else {
    console.error(`[Laravel] Falha ao processar reembolso para user ${userId}`);
    return null;
  }
};

// 10. Cancelar uma match
export const cancelMatch = async (
  matchId,
  token,
  reason = "Server timeout",
) => {
  const body = {
    status: "Cancelled",
    reason: reason,
    cancelled_at: new Date().toISOString(),
  };

  console.log(`[Laravel] Cancelando match ${matchId}. Razão: ${reason}`);
  const result = await apiCall(
    "POST",
    `/matches/${matchId}/cancel`,
    body,
    token,
  );

  if (result) {
    console.log(`[Laravel] Match ${matchId} cancelada com sucesso`);
    return result;
  } else {
    console.error(`[Laravel] Falha ao cancelar match ${matchId}`);
    return null;
  }
};

// 11. Cancelar um game
export const cancelGame = async (gameId, token, reason = "Server timeout") => {
  const body = {
    status: "Cancelled",
    reason: reason,
    cancelled_at: new Date().toISOString(),
  };

  console.log(`[Laravel] Cancelando game ${gameId}. Razão: ${reason}`);
  const result = await apiCall("POST", `/games/${gameId}/cancel`, body, token);

  if (result) {
    console.log(`[Laravel] Game ${gameId} cancelado com sucesso`);
    return result;
  } else {
    console.error(`[Laravel] Falha ao cancelar game ${gameId}`);
    return null;
  }
};
