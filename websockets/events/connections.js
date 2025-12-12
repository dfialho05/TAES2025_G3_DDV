import * as ConnectionState from "../state/connections.js";

export const connectionsHandlers = (io, socket) => {
    socket.on("join", (userData) => {
      const token = socket.data.token; // Recupera o token guardado no index.js

      const userWithToken = {
          ...userData, 
          token: token 
      };

      ConnectionState.addUser(socket.id, userWithToken);
      console.log(`👤 User registado: ${userWithToken.name} (Token: ${!!token})`);
    });

    socket.on("disconnect", () => {
      ConnectionState.removeUser(socket.id);
    });
};