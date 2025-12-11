// websockets/state/game.js
import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js"; 

// Armazém de todos os jogos ativos em memória
const games = new Map();
let currentGameID = 0;

// [FUNÇÃO: createGame]
// CORREÇÃO: Adicionado 'winsNeeded' (default 1) e passado para o 'new BiscaGame'
export const createGame = (gameType, user, mode = 'singleplayer', winsNeeded = 1) => {
    currentGameID++;
    const gameID = currentGameID;

    console.log(`[State] A criar jogo ID ${gameID} (Modo: ${mode}, Meta: ${winsNeeded})`);

    // Passamos a meta de vitórias para a Lógica do Jogo
    const newGame = new BiscaGame(gameType, mode, winsNeeded);
    
    newGame.id = gameID;
    newGame.creator = user.id;
    newGame.player1 = user; 
    newGame.player2 = null;

    // Se for Multiplayer, pausa o jogo até o Player 2 entrar
    if (mode === 'multiplayer') {
        newGame.turn = null; 
        newGame.logs = "À espera de adversário...";
    }

    games.set(gameID, newGame);
    return newGame;
};

// [FUNÇÃO: joinGame]
export const joinGame = (gameID, user) => {
    const game = games.get(gameID);
    if (!game) return null;

    // Se o lugar 2 estiver livre E quem tenta entrar não for o dono (P1)
    if (!game.player2 && game.player1.id !== user.id) {
        game.player2 = user;
        return game;
    }
    return null;
};

// [FUNÇÃO: getGames]
export const getGames = () => {
    return Array.from(games.values())
        .filter(game => !game.gameOver && !game.player2 && game.mode === 'multiplayer')
        .map(game => ({
            id: game.id,
            type: game.player1Hand.length === 3 ? "3 Cartas" : "9 Cartas",
            creator: game.player1.name, 
            winsNeeded: game.winsNeeded // Informação útil para o lobby
        }));
};

// [FUNÇÃO: getGame]
export const getGame = (gameID) => {
    return games.get(gameID);
};

// [FUNÇÃO: removeGame]
export const removeGame = (gameID) => {
    games.delete(gameID);
    console.log(`🗑️ Jogo ${gameID} removido da memória.`);
};

// [FUNÇÃO: handlePlayerMove]
export const handlePlayerMove = (gameID, cardIndex, socketID) => { 
    console.log(`--- 🏁 INÍCIO JOGADA (Game ${gameID}) ---`);
    
    const game = games.get(gameID);
    if (!game) {
        console.error(`❌ Jogo ${gameID} não encontrado em memória.`);
        return null;
    }

    const actingUser = getUser(socketID); 
    if (!actingUser) {
        console.error(`❌ Socket ${socketID} não tem User associado.`);
        return null;
    }

    console.log(`👤 User a tentar jogar: ${actingUser.name} (ID: ${actingUser.id})`);
    
    let side = null;

    const p1ID = String(game.player1.id);
    const actorID = String(actingUser.id);
    const p2ID = game.player2 ? String(game.player2.id) : null;

    if (p1ID === actorID) { 
        side = "player1";
    } 
    else if (p2ID && p2ID === actorID) {
        side = "player2";
    } 
    
    if (!side) {
        console.error(`⛔ BLOQUEADO: O user ${actingUser.name} não pertence a este jogo.`);
        return null;
    }

    if (game.tableCards.length >= 2) {
        console.warn(`⛔ BLOQUEADO: A mesa está cheia (Resolvendo Vaza).`);
        return { game, moveValid: false };
    }
    
    console.log(`✅ Autorizado como: ${side}. A processar movimento...`);

    const moveValid = game.playCard(side, cardIndex);
    
    if (!moveValid) {
        console.warn(`⚠️ Regras do Jogo bloquearam.`);
    } else {
        console.log(`🎉 Sucesso! Carta jogada.`);
    }

    return { game, moveValid };
};

// [FUNÇÃO: advanceGame]
export const advanceGame = (gameID, io) => {
    const game = games.get(gameID);
    if (!game || game.gameOver) return;

    const roomName = `game-${game.id}`;

    // CENÁRIO A: Fim da Vaza (2 Cartas na mesa)
    if (game.tableCards.length >= 2) {
        
        const winner = game.resolveRound();
        
        // Mostra a 2ª carta
        io.to(roomName).emit("game_state", game.getState());

        // Pausa Dramática (1.5 segundos)
        setTimeout(() => {
            if (!games.has(gameID)) return; 

            // Limpa a mesa, distribui cartas E verifica vitória de Sessão
            game.cleanupRound(winner);
            
            // Atualiza ecrã (mesa limpa ou Game Over)
            io.to(roomName).emit("game_state", game.getState());

            // Recursividade
            advanceGame(gameID, io); 
        }, 1500);

        return; 
    }

    // CENÁRIO B: Turno do Bot (Singleplayer)
    if (!game.player2 && game.turn === 'player2') {
        
        const thinkingTime = Math.random() * 1000 + 1000;

        setTimeout(() => {
            if (!games.has(gameID)) return;

            game.playBotCard();
            
            io.to(roomName).emit("game_state", game.getState());

            advanceGame(gameID, io);
        }, thinkingTime);
    }
};