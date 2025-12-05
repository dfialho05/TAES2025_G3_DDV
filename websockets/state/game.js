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

// --- CORREÇÃO AQUI NA LÓGICA DE MOVIMENTO ---
export const handlePlayerMove = (gameID, cardIndex, socketID) => { 
    const game = games.get(gameID);
    if (!game) return null;

    // 2. Primeiro, descobrimos QUEM é o user por trás deste socket
    const actingUser = getUser(socketID); 

    if (!actingUser) {
        console.log(`[Move Error] Socket ${socketID} não está autenticado.`);
        return null;
    }

    let side = null;

    // 3. Agora comparamos USER ID com USER ID (maçãs com maçãs)
    if (game.player1.id === actingUser.id) { 
        side = "player1";
    } 
    else if (game.player2 && game.player2.id === actingUser.id) {
        side = "player2";
    } 
    
    if (!side) {
        console.log(`[Block] User ${actingUser.name} tentou mexer no jogo errado.`);
        return null;
    }

    const moveValid = game.playCard(side, cardIndex);
    return { game, moveValid };
};

export const handleBotLoop = (gameID, io) => {
    const game = games.get(gameID);

    if (!game || game.gameOver) return;

    const roomName = `game-${game.id}`;

    if (game.tableCards.length < 2) {
        game.playBotCard();
        io.to(roomName).emit("game_state", game.getState());
    }

    if (game.tableCards.length === 2) {
        const winner = game.resolveRound();
        io.to(roomName).emit("game_state", game.getState());

        setTimeout(() => {
            if (!games.has(gameID)) return;

            game.cleanupRound(winner);
            io.to(roomName).emit("game_state", game.getState());

            if (game.turn === "player2" && !game.gameOver) {
                setTimeout(() => handleBotLoop(gameID, io), 1000);
            }
        }, 1500);
    }
};