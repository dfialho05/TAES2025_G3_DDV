// websockets/events/connections.js
import * as GameState from "../state/connections.js";


export const connectionsHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Jogador conectado: ${socket.id}`);


    // ------------------------- Eventos do Jogador -------------------

    socket.on("join_game", (gameType) => {
      GameState.createGame(socket, gameType);
    });


    socket.on("play_card", (cardIndex) => {
      GameState.handlePlayerMove(socket, cardIndex);
    });

    //----------------------------- Eventos para gerir users -------------------------------

    // Ocorre quando o frontend diz "Eu sou o User X" (Login)
    socket.on("join", (user) => {
      // Adiciona ao Map de users
      GameState.addUser(socket, user);
      
      console.log(`[Connection] User ${user.name} has joined the server`);
      console.log(`[Connection] ${GameState.getUserCount()} users online`);
    });

    // Ocorre se o utilizador clicar num botão de "Logout" explícito
    socket.on("leave", () => {
      const user = GameState.removeUser(socket.id);
      
      if (user) {
        console.log(`[Connection] User ${user.name} has left the server`);
      }
      console.log(`[Connection] ${GameState.getUserCount()} users online`);
    });

    //------------------------------- Eventos Comuns --------------------------------------
    socket.on("disconnect", () => {
      console.log("Connection Lost:", socket.id);

      // A. Limpa o Jogo (se estiver a jogar)
      GameState.removeGame(socket);

      // B. Limpa o User (da lista de online)
      const user = GameState.removeUser(socket.id);
      
      console.log(`[Connection] ${GameState.getUserCount()} users online`);
    });
    
  });
};