// websockets/state/game.js
import { BiscaGame } from "../RegrasJogo/Game.js";
import { getUser } from "./connections.js"; // <--- 1. IMPORTANTE: Importar o getUser

const games = new Map();
let currentGameID = 0;

export const createGame = (gameType, user, mode = 'singleplayer') => {
    currentGameID++;
    const gameID = currentGameID;

    const newGame = new BiscaGame(gameType);
    newGame.id = gameID;
    newGame.mode = mode;
    newGame.creator = user.id;
    newGame.player1 = user; 
    newGame.player2 = null;

    games.set(gameID, newGame);
    return newGame;
};

export const joinGame = (gameID, user) => {
    const game = games.get(gameID);
    if (!game) return null;

    if (!game.player2 && game.player1.id !== user.id) {
        game.player2 = user;
        return game;
    }
    return null;
};

export const getGames = () => {
    return Array.from(games.values())
        .filter(game => !game.gameOver && !game.player2 && game.mode === 'multiplayer')
        .map(game => ({
            id: game.id,
            type: game.player1Hand.length === 3 ? "3 Cartas" : "9 Cartas",
            creator: game.player1.name, 
        }));
};

export const getGame = (gameID) => {
    return games.get(gameID);
};

export const removeGame = (gameID) => {
    games.delete(gameID);
};

export const handlePlayerMove = (gameID, cardIndex, socketID) => { 
    console.log(`--- 🏁 INÍCIO JOGADA (Game ${gameID}) ---`);
    
    const game = games.get(gameID);
    if (!game) {
        console.error(`❌ Jogo ${gameID} não encontrado em memória.`);
        return null;
    }

    // 1. Quem é o user?
    const actingUser = getUser(socketID); 
    if (!actingUser) {
        console.error(`❌ Socket ${socketID} não tem User associado. (Reiniciaste o servidor?)`);
        return null;
    }

    console.log(`👤 User a tentar jogar: ${actingUser.name} (ID: ${actingUser.id})`);
    
    let side = null;

    // 2. Comparação de IDs "À Prova de Balas" (Converte tudo para String)
    const p1ID = String(game.player1.id);
    const actorID = String(actingUser.id);
    const p2ID = game.player2 ? String(game.player2.id) : null;

    console.log(`🔍 Comparando: Actor(${actorID}) vs P1(${p1ID}) vs P2(${p2ID})`);

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

    const moveValid = game.playCard(side, cardIndex);
    
    if (!moveValid) {
        console.warn(`⚠️ Regras do Jogo bloquearam (Turno errado ou naipe obrigatório).`);
    } else {
        console.log(`🎉 Sucesso! Carta jogada.`);
    }

    return { game, moveValid };
};

export const advanceGame = (gameID, io) => {
    const game = games.get(gameID);
    if (!game || game.gameOver) return;

    const roomName = `game-${game.id}`;

    // CASO 1: A mesa está cheia (2 cartas)? -> RESOLVER VAZA
    // Funciona para Multiplayer e Singleplayer igual!
    if (game.tableCards.length >= 2) {
        
        // Resolve quem ganhou
        const winner = game.resolveRound();
        
        // Atualiza o front (mostra a 2ª carta e a animação)
        io.to(roomName).emit("game_state", game.getState());

        // Pausa dramática para verem quem ganhou
        setTimeout(() => {
            if (!games.has(gameID)) return;

            // Limpa a mesa e distribui cartas
            game.cleanupRound(winner);
            
            // Atualiza o front (mesa limpa)
            io.to(roomName).emit("game_state", game.getState());

            // Recursividade: O jogo avançou, vamos ver se agora é a vez do Bot
            advanceGame(gameID, io); 
        }, 1500);

        return; // Sai da função para não executar o código do bot abaixo nesta passada
    }

    // CASO 2: A mesa não está cheia. É a vez do Bot?
    // Só entra aqui se o jogo for Singleplayer (!game.player2)
   if (!game.player2 && game.turn === 'player2') {
        
        // Antes: game.playBotCard(); io.to...
        
        // AGORA: Adicionamos "Tempo de Cérebro" (ex: 1 a 2 segundos)
        const thinkingTime = Math.random() * 1000 + 1000; // Entre 1s e 2s

        setTimeout(() => {
            // Verificar se o jogo ainda existe (o player pode ter saído durante o "pensar")
            if (!games.has(gameID)) return;

            game.playBotCard();
            
            // Avisa o frontend
            io.to(roomName).emit("game_state", game.getState());

            // Recursividade
            advanceGame(gameID, io);
        }, thinkingTime);
    }
    
    // CASO 3: É a vez de um Humano?
    // A função acaba aqui e o servidor fica à espera do evento 'play_card' do socket.
};

