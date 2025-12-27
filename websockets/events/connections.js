import * as ConnectionState from "../state/connections.js";

export const connectionsHandlers = (io, socket) => {
  socket.on("join", (userData) => {
    // 1. Tentar pegar o token real do socket
    const token = socket.handshake.auth.token || socket.data.token || null;

    // 2. Validação de segurança
    if (!userData || userData.id === 'loading') {
        console.warn(`⚠️ [Connection] Tentativa de join ignorada: Dados inválidos ou 'loading' (Socket: ${socket.id})`);
        return;
    }

    // 3. Mesclar dados e forçar ID como String
    const userWithToken = {
      ...userData,
      id: String(userData.id || socket.id), // Força String
      token: token,
    };

    ConnectionState.addUser(socket.id, userWithToken);
    console.log(`👤 User registado: ${userWithToken.name} (ID: ${userWithToken.id}) (Socket: ${socket.id})`);
  });

  socket.on("disconnect", () => {
    ConnectionState.removeUser(socket.id);
    console.log(`❌ User desconectado: ${socket.id}`);
  });
};