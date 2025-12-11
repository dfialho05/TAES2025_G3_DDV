// websockets/state/game.js
import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js"; 

// Armazém de todos os jogos ativos em memória
const games = new Map();
let currentGameID = 0;

// [FUNÇÃO: createGame]
// 1. Gera um ID novo.
// 2. Cria uma instância da classe 'BiscaGame' (as regras).
// 3. Define o criador como Player 1.
// 4. Guarda o jogo no mapa 'games'.
export const createGame = (gameType, user, mode = 'singleplayer') => {
    currentGameID++;
    const gameID = currentGameID;

    const newGame = new BiscaGame(gameType, mode);
    newGame.id = gameID;
    newGame.creator = user.id;
    newGame.player1 = user; 
    newGame.player2 = null;

    if (mode === 'multiplayer') {
        newGame.turn = null; // Ninguém joga enquanto não houver 2 pessoas
        newGame.logs = "À espera de adversário...";
    }

    games.set(gameID, newGame);
    return newGame;
};

// [FUNÇÃO: joinGame]
// Usada apenas no Multiplayer.
// 1. Verifica se o jogo existe.
// 2. Verifica se a vaga do Player 2 está vazia.
// 3. Impede que o Player 1 jogue contra si próprio.
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
// Usada pelo Lobby.
// Filtra e devolve apenas os jogos que:
// - São Multiplayer.
// - Ainda não têm Player 2.
// - Não terminaram.
export const getGames = () => {
    return Array.from(games.values())
        .filter(game => !game.gameOver && !game.player2 && game.mode === 'multiplayer')
        .map(game => ({
            id: game.id,
            type: game.player1Hand.length === 3 ? "3 Cartas" : "9 Cartas",
            creator: game.player1.name, 
        }));
};

// [FUNÇÃO: getGame]
// Simples getter para obter um jogo pelo ID.
export const getGame = (gameID) => {
    return games.get(gameID);
};

// [FUNÇÃO: removeGame]
// Remove o jogo da memória para libertar recursos.
// Chamado quando o jogo acaba ou alguém desiste.
export const removeGame = (gameID) => {
    games.delete(gameID);
    console.log(`🗑️ Jogo ${gameID} removido da memória.`);
};

// [FUNÇÃO: handlePlayerMove]
// Esta função é o "Segurança" da jogada.
// 1. Verifica se o jogo existe.
// 2. Verifica se o socket pertence a um user real.
// 3. Determina se o user é o 'player1' ou 'player2'.
// 4. Chama a lógica de regras (game.playCard).
export const handlePlayerMove = (gameID, cardIndex, socketID) => { 
    console.log(`--- 🏁 INÍCIO JOGADA (Game ${gameID}) ---`);
    
    const game = games.get(gameID);
    if (!game) {
        console.error(`❌ Jogo ${gameID} não encontrado em memória.`);
        return null;
    }

    // Identificar o User pelo Socket
    const actingUser = getUser(socketID); 
    if (!actingUser) {
        console.error(`❌ Socket ${socketID} não tem User associado.`);
        return null;
    }

    console.log(`👤 User a tentar jogar: ${actingUser.name} (ID: ${actingUser.id})`);
    
    let side = null;

    // Comparação de IDs (Convertemos para String para evitar bugs de tipos "1" vs 1)
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

    console.log(`✅ Autorizado como: ${side}. A processar movimento...`);

    // Executa a jogada nas Regras
    const moveValid = game.playCard(side, cardIndex);
    
    if (!moveValid) {
        console.warn(`⚠️ Regras do Jogo bloquearam (Turno errado ou naipe obrigatório).`);
    } else {
        console.log(`🎉 Sucesso! Carta jogada.`);
    }

    return { game, moveValid };
};

// [FUNÇÃO: advanceGame]
// O "Maestro" do ritmo de jogo.
// É recursivo e lida com os tempos de espera.
// - Se a mesa tem 2 cartas: Pausa 1.5s -> Resolve Vaza -> Limpa Mesa.
// - Se é a vez do Bot: Pausa ~1.5s -> Bot Joga.
export const advanceGame = (gameID, io) => {
    const game = games.get(gameID);
    if (!game || game.gameOver) return;

    const roomName = `game-${game.id}`;

    // CENÁRIO A: Fim da Vaza (2 Cartas na mesa)
    if (game.tableCards.length >= 2) {
        
        // 1. Calcula quem ganhou
        const winner = game.resolveRound();
        
        // 2. Mostra a 2ª carta jogada (antes de limpar)
        io.to(roomName).emit("game_state", game.getState());

        // 3. Pausa Dramática (1.5 segundos)
        setTimeout(() => {
            if (!games.has(gameID)) return; // Segurança caso o jogo tenha sido apagado entretanto

            // 4. Limpa a mesa e distribui novas cartas
            game.cleanupRound(winner);
            
            // 5. Atualiza o ecrã (mesa limpa)
            io.to(roomName).emit("game_state", game.getState());

            // 6. Recursividade: Verifica se o próximo a jogar é o Bot
            advanceGame(gameID, io); 
        }, 1500);

        return; 
    }

    // CENÁRIO B: Turno do Bot (Singleplayer)
    // Só acontece se não houver Player 2 humano E for a vez do 'player2'
    if (!game.player2 && game.turn === 'player2') {
        
        // Simula "Tempo de Pensar" (1 a 2 segundos)
        const thinkingTime = Math.random() * 1000 + 1000;

        setTimeout(() => {
            if (!games.has(gameID)) return;

            // Bot joga
            game.playBotCard();
            
            // Mostra a jogada do Bot
            io.to(roomName).emit("game_state", game.getState());

            // Recursividade: Verifica se a vaza acabou (Cenário A)
            advanceGame(gameID, io);
        }, thinkingTime);
    }
};