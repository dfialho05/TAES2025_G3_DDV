
import * as ConnectionState from "../state/connections.js";
import * as GameState from "../state/game.js";

export const connectionsHandlers = (io, socket) => {

    

    //----------------------------- Eventos para gerir users -------------------------------

    socket.on("join", (user) => {
      ConnectionState.addUser(socket, user);
      console.log(`[Connection] User ${user.name} has joined the server`);
      console.log(`[Connection] ${ConnectionState.getUserCount()} users online`);
    });

    socket.on("leave", () => {
      const user = ConnectionState.removeUser(socket.id);
      if (user) {
        console.log(`[Connection] User ${user.name} has left the server`);
      }
      console.log(`[Connection] ${ConnectionState.getUserCount()} users online`);
    });

    //------------------------------- Eventos Comuns --------------------------------------
    socket.on("disconnect", () => {
      console.log("Connection Lost:", socket.id);

      // A. Limpa o Jogo (se estiver a jogar) - (Se estiveres a usar IDs numéricos, isto precisará de ajuste futuro, mas para já serve)
      // GameState.removeGame(socket); 

      // B. Remove o User da lista
      const user = ConnectionState.removeUser(socket.id);
      
      if (user) {
        console.log(`❌ Jogador saiu: ${user.name}`);
      } else {
        console.log(`❌ Socket desconectado (anónimo): ${socket.id}`);
      }
      
      console.log(`[Connection] ${ConnectionState.getUserCount()} users online`);
    });
};