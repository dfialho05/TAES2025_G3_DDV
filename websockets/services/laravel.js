import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api'; 
const BOT_ID = 9999; 

const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 5000 
});

async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {};
        if (token) config.headers = { 'Authorization': `Bearer ${token}` };
        const response = await apiClient({ method, url: endpoint, data, ...config });
        return response.data;
    } catch (error) {
        if (error.response) console.error(`❌ Laravel Error [${endpoint}]:`, error.response.data);
        else console.error(`❌ Network/Axios Error [${endpoint}]:`, error.message);
        return null;
    }
}

// 1. Criar MATCH (Sessão)
export const createMatch = async (player1, player2, type, stake = 0, token) => {
    const p2Id = player2 ? player2.id : BOT_ID; 
    const body = {
        type: type, 
        status: 'Playing',
        player1_user_id: player1.id,
        player2_user_id: p2Id,
        stake: stake,
        player1_marks: 0,
        player2_marks: 0
    };
    const result = await apiCall('POST', '/matches', body, token);
    return result ? result : null;
};

// 2. Finalizar MATCH
export const finishMatch = async (matchId, winnerId, p1Marks, p2Marks, p1Points, p2Points, token) => {
    const finalP1Marks = Math.min(p1Marks, 4);
    const finalP2Marks = Math.min(p2Marks, 4);

    const body = { 
        winner_user_id: winnerId, 
        player1_marks: finalP1Marks, 
        player2_marks: finalP2Marks,
        player1_points: p1Points,
        player2_points: p2Points
    };
    return await apiCall('POST', `/matches/${matchId}/finish`, body, token);
};

// 3. Criar JOGO SOLTO (Standalone)
export const createStandaloneGame = async (player1Id, player2Id, type, token) => {
    const p2Id = player2Id || BOT_ID;
    const body = {
        match_id: null,
        type: type,
        status: 'Playing',
        player1_points: 0,
        player2_points: 0,
        player1_user_id: player1Id,
        player2_user_id: p2Id
    };
    const result = await apiCall('POST', '/games', body, token);
    return result ? result.id : null;
};

// 4. Criar JOGO VINCULADO (Dentro de uma Match)
export const createGameForMatch = async (matchId, player1Id, player2Id, token) => {
    const p2Id = player2Id || BOT_ID;
    const body = { 
        status: 'Playing', 
        player1_points: 0, 
        player2_points: 0,
        player1_user_id: player1Id,
        player2_user_id: p2Id 
    };
    const result = await apiCall('POST', `/matches/${matchId}/games`, body, token);
    return result ? result.id : null;
};

// 5. Finalizar Jogo Individual
export const finishGame = async (gameId, winnerId, p1Points, p2Points, token) => {
    const body = { winner_user_id: winnerId, player1_points: p1Points, player2_points: p2Points };
    return await apiCall('POST', `/games/${gameId}/finish`, body, token);
};