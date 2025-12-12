import * as GameState from "../state/game.js"; 
import * as ConnectionState from "../state/connections.js"; 

export const gameHandlers = (io, socket) => {
    socket.on("get-games", () => socket.emit("games", GameState.getGames()));

    socket.on("create-game", async (gameType, mode, targetWins) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const game = await GameState.createGame(gameType, user, mode || 'singleplayer', targetWins || 1); 

        socket.join(`game-${game.id}`);
        console.log(`[Game] Criado jogo ${game.id} por ${user.name}`);

        socket.emit("game-joined", game.getState());
        io.emit("games", GameState.getGames());
    });

    socket.on("play_card", (data) => {
        const result = GameState.handlePlayerMove(data.gameID, data.cardIndex, socket.id);
        if (result && result.moveValid) {
            const game = result.game;
            io.to(`game-${game.id}`).emit("game_state", game.getState());
            GameState.advanceGame(game.id, io); 
        }
    });
    
    socket.on("join-game", (gid) => { 
        const user = ConnectionState.getUser(socket.id);
        const game = GameState.joinGame(gid, user);
        if(game) {
            socket.join(`game-${gid}`);
            io.to(`game-${gid}`).emit("game_state", game.getState());
        }
    });
    
    socket.on("leave_game", (gid) => { 
        socket.leave(`game-${gid}`);
    });

    // CORREÇÃO: Reiniciar o loop do jogo quando o utilizador clica em "Próxima Ronda"
    socket.on("next_round", (gid) => {
        const game = GameState.getGame(gid);
        if (game) {
            // Se o jogo acabou mesmo (campeonato finalizado), não reinicia
            if (game.gameOver) return; 

            console.log(`[Game] Next Round solicitado para Jogo ${gid}`);
            game.confirmNextRound(); // Define roundOver = false
            
            // 1. Envia estado limpo para o cliente (fecha popup)
            io.to(`game-${gid}`).emit("game_state", game.getState());
            
            // 2. REINICIA O LOOP DO BOT
            GameState.advanceGame(gid, io);
        }
    });
};