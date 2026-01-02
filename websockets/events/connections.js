import * as ConnectionState from "../state/connections.js";

export const connectionsHandlers = (io, socket) => {
  socket.on("join", (userData) => {
    // DEBUG: Log completo do que chega
    console.log(`\n[JOIN DEBUG] Socket ${socket.id}`);
    console.log(`  userData recebido:`, userData);
    console.log(
      `  userData.token:`,
      userData?.token
        ? `PRESENTE (${userData.token.substring(0, 20)}...)`
        : "AUSENTE",
    );
    console.log(
      `  socket.handshake.auth.token:`,
      socket.handshake.auth.token
        ? `PRESENTE (${socket.handshake.auth.token.substring(0, 20)}...)`
        : "AUSENTE",
    );
    console.log(
      `  socket.data.token:`,
      socket.data.token
        ? `PRESENTE (${socket.data.token.substring(0, 20)}...)`
        : "AUSENTE",
    );

    // 1. Tentar pegar o token real do socket
    //    - prioriza token enviado no payload do 'join' (se presente)
    //    - fallback para handshake / socket.data
    const tokenFromHandshake =
      socket.handshake.auth.token || socket.data.token || null;
    const tokenFromPayload = userData && userData.token ? userData.token : null;
    const token = tokenFromPayload || tokenFromHandshake;

    console.log(
      `  Token FINAL escolhido:`,
      token ? `PRESENTE (${token.substring(0, 20)}...)` : "AUSENTE\n",
    );

    // Persistir token enviado no payload no socket para chamadas futuras
    if (tokenFromPayload) {
      socket.data.token = tokenFromPayload;
    }

    // 2. Validação de segurança
    if (!userData || userData.id === "loading") {
      console.warn(
        ` [Connection] Tentativa de join ignorada: Dados inválidos ou 'loading' (Socket: ${socket.id})`,
      );
      return;
    }

    // 3. Mesclar dados e forçar ID como String
    const userWithToken = {
      ...userData,
      id: String(userData.id || socket.id), // Força String
      token: token,
    };

    ConnectionState.addUser(socket.id, userWithToken);
    console.log(
      ` User registado: ${userWithToken.name} (ID: ${userWithToken.id}) (Socket: ${socket.id})`,
    );
  });

  socket.on("disconnect", () => {
    // Tenta remover e guarda o user removido numa variável
    const removedUser = ConnectionState.removeUser(socket.id);

    if (removedUser) {
      console.log(
        ` User desconectado e removido: ${removedUser.name} (${socket.id})`,
      );
    } else {
      // Se já não existia (talvez limpo noutro lado ou conexão fantasma)
      console.log(` Socket desconectado: ${socket.id}`);
    }
  });
};
