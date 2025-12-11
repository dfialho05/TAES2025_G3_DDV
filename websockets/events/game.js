// websockets/events/game.js
import * as GameState from "../state/game.js"; 
import * as ConnectionState from "../state/connections.js"; 

export const gameHandlers = (io, socket) => {

    // =================================================================
    // 1. ZONA DO LOBBY
    // =================================================================

    // [EVENTO: get-games]
    // O Lobby pede a lista de jogos ativos.
    // O servidor responde apenas para o socket que pediu.
    socket.on("get-games", () => {
        socket.emit("games", GameState.getGames());
    });

    // [EVENTO: create-game]
    // 1. Identifica o user através do socket.
    // 2. Pede ao GameState para criar o objeto do jogo.
    // 3. Coloca o socket numa sala privada (socket.join).
    // 4. Envia o jogo criado ao dono (game-joined).
    // 5. Atualiza a lista pública para todos os users (io.emit).
    socket.on("create-game", (gameType, mode) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const gameMode = mode || 'singleplayer';

        const game = GameState.createGame(gameType, user, gameMode); 

        const roomName = `game-${game.id}`;
        socket.join(roomName);

        console.log(`[Game] ${user.name} criou o jogo ${game.id} (Modo: ${gameMode}, Sala: ${roomName})`);

        socket.emit("game-joined", game.getState());
        io.emit("games", GameState.getGames());
    });

    // [EVENTO: join-game]
    // 1. Tenta adicionar o User ao Jogo no GameState.
    // 2. Se conseguir, coloca o socket na MESMA sala do criador.
    // 3. Avisa a sala (io.to) que o jogo começou (atualiza o ecrã de ambos).
    // 4. Remove o jogo da lista pública do lobby (io.emit).
    socket.on("join-game", (gameID) => {
        const user = ConnectionState.getUser(socket.id);
        if (!user) return;

        const game = GameState.joinGame(gameID, user);
        
        if (game) {
            const roomName = `game-${game.id}`;
            socket.join(roomName); 
            
            console.log(`[Game] ${user.name} entrou no jogo ${game.id}`);

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

    // [EVENTO: play_card]
    // 1. Valida se a jogada é legal no GameState (turno, naipe, posse da carta).
    // 2. Se for válida, garante que o socket está na sala (segurança).
    // 3. Envia o novo estado para a sala (mostra a carta na mesa).
    // 4. Chama o 'advanceGame' para decidir o próximo passo (bot, vaza, fim de jogo).
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
    // 3. ZONA DE SAÍDA (A Correção do Bug)
    // =================================================================

    // [EVENTO: leave_game]
    // 1. IMPORTANTE: Remove o socket da sala (socket.leave). Isto impede receber eventos fantasma.
    // 2. Se o jogo ainda estiver ativo, marca como GameOver (Desistência).
    // 3. Avisa o jogador restante que ganhou.
    // 4. Apaga o jogo da memória após 5 segundos.
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