import { Server } from "socket.io";
import { connectionsHandlers } from "./events/connections.js";
import { gameHandlers } from "./events/game.js";

const io = new Server(3000, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", async (socket) => {
  // CAPTURAR TOKEN
  const token = socket.handshake.auth.token;
  socket.data.token = token; // Guarda no socket para uso posterior

  if (token) {
    console.log(`🔌 Socket ${socket.id} ligado COM Token.`);
  } else {
    console.log(`⚠️ Socket ${socket.id} ligado SEM Token.`);

    // Criar usuário anônimo para jogos de practice
    const { addUser } = await import("./state/connections.js");
    const anonymousUser = {
      id: `anon_${socket.id}`,
      name: "Guest Player",
      token: null,
    };

    addUser(socket.id, anonymousUser);
    console.log(
      `👤 Usuário anônimo criado: ${anonymousUser.name} (Practice Mode)`,
    );
  }

  connectionsHandlers(io, socket);
  gameHandlers(io, socket);
});

console.log("🚀 Servidor Bisca na porta 3000...");
