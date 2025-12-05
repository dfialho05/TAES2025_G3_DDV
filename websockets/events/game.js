// websockets/events/game.js
import * as GameState from "../state/game.js";
import * as ConnectionState from "../state/connections.js"; 

export const gameHandlers = (io, socket) => {

    // --- LOBBY: Pedir lista de jogos ---
    socket.on("get-games", () => {
        socket.emit("games", GameState.getGames());
    });

    // --- LOBBY: Criar Jogo ---
    socket.on("create-game", (gameType) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        // Cria o jogo no State (agora com ID numérico)
        const game = GameState.createGame(gameType, user);

        // OBRIGATÓRIO: O socket entra na "Sala" deste jogo
        socket.join(`game-${game.id}`); // [cite: 203]

        console.log(`[Game] ${user.name} criou o jogo ${game.id}`);

        // 1. Envia o jogo para quem criou (para mudar de ecrã)
        socket.emit("game-joined", game.getState());

        // 2. Avisa toda a gente no Lobby que há um jogo novo
        io.emit("games", GameState.getGames()); // [cite: 204]
    });

    // --- LOBBY: Entrar num Jogo (Player 2) ---
    socket.on("join-game", (gameID) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const game = GameState.joinGame(gameID, user);
        
        if (game) {
            // Entra na mesma sala do Player 1
            socket.join(`game-${game.id}`); // [cite: 288]
            
            console.log(`[Game] ${user.name} entrou no jogo ${game.id}`);

            // Avisa a sala (P1 e P2) que o jogo começou
            io.to(`game-${game.id}`).emit("game_state", game.getState()); // [cite: 292]
            
            // Remove o jogo da lista do Lobby (porque ficou cheio)
            io.emit("games", GameState.getGames());
        }
    });

    // --- JOGO: Jogar uma Carta ---
    socket.on("play_card", (data) => {
        const gameID = data.gameID;
        const cardIndex = data.cardIndex;

        // CORREÇÃO: Passamos socket.id como 3º argumento
        const result = GameState.handlePlayerMove(gameID, cardIndex, socket.id);

        if (result && result.moveValid) {
            const game = result.game;
            
            // Emite para a SALA inteira
            io.to(`game-${game.id}`).emit("game_state", game.getState());

            // Se for contra o Bot (player2 é null), ativamos o Bot
            if (!game.player2) {
                setTimeout(() => {
                    // Passamos o 'io' para o Bot conseguir emitir para a sala
                    GameState.handleBotLoop(game.id, io); 
                }, 1000);
            }
        }
    });
};