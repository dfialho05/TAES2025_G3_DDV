// websockets/events/game.js
import * as GameState from "../state/game.js"; 
import * as ConnectionState from "../state/connections.js"; 

export const gameHandlers = (io, socket) => {

    // =================================================================
    // 1. ZONA DO LOBBY
    // =================================================================

    socket.on("get-games", () => {
        socket.emit("games", GameState.getGames());
    });

    // [EVENTO: create-game]
    // Agora aceita 'targetWins' (1 ou 4) vindo do frontend
    socket.on("create-game", (gameType, mode, targetWins) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const gameMode = mode || 'singleplayer';
        
        // Se não vier nada, assume 1 vitória (jogo rápido)
        const winsNeeded = targetWins || 1; 

        // Passa 'winsNeeded' para o State
        const game = GameState.createGame(gameType, user, gameMode, winsNeeded); 

        const roomName = `game-${game.id}`;
        socket.join(roomName);

        console.log(`[Game] ${user.name} criou o jogo ${game.id} (Modo: ${gameMode}, Meta: ${winsNeeded})`);

        socket.emit("game-joined", game.getState());
        io.emit("games", GameState.getGames());
    });

    // [EVENTO: join-game]
    socket.on("join-game", (gameID) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const game = GameState.joinGame(gameID, user);
        
        if (game) {
            const roomName = `game-${game.id}`;
            socket.join(roomName); 
            
            console.log(`[Game] ${user.name} entrou no jogo ${game.id}`);

            // [CRUCIAL] Se for Multiplayer, ativa o jogo quando o P2 entra!
            if (game.mode === 'multiplayer') {
                game.turn = 'player1'; // Define quem começa
                game.logs = "Adversário entrou! O jogo começou.";
            }
            
            io.to(roomName).emit("game_state", game.getState()); 
            io.emit("games", GameState.getGames());
        }
    });

    // =================================================================
    // 2. ZONA DE JOGO
    // =================================================================

    socket.on("play_card", (data) => {
        const gameID = data.gameID;
        const cardIndex = data.cardIndex;

        const result = GameState.handlePlayerMove(gameID, cardIndex, socket.id);

        if (result && result.moveValid) {
            const game = result.game;
            const roomName = `game-${game.id}`;

            socket.join(roomName);

            io.to(roomName).emit("game_state", game.getState());

            GameState.advanceGame(game.id, io); 
        }
    });

    // =================================================================
    // 3. ZONA DE SAÍDA
    // =================================================================

    socket.on("leave_game", (gameID) => {
        const roomName = `game-${gameID}`;
        
        socket.leave(roomName);
        console.log(`[Game] Socket ${socket.id} saiu da sala ${roomName}`);

        const game = GameState.getGame(gameID);
        if (game) {
            if (!game.gameOver) {
                game.gameOver = true;
                game.logs = "O oponente desistiu do jogo.";
                
                io.to(roomName).emit("game_state", game.getState());
                
                setTimeout(() => {
                    GameState.removeGame(gameID);
                    io.emit("games", GameState.getGames());
                }, 5000);
            }
        }
    });
};