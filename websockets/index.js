import { Server } from "socket.io";
import { connectionsHandlers } from "./events/connections.js";
import { gameHandlers } from "./events/game.js";

const io = new Server(3000, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Make io globally available for balance updates
global.io = io;

io.on("connection", async (socket) => {
  // CAPTURAR TOKEN
  const token = socket.handshake.auth.token;
  socket.data.token = token;

  if (token) {
    console.log(` Socket ${socket.id} ligado COM Token.`);
  } else {
    console.log(` Socket ${socket.id} ligado SEM Token.`);

    // Criar usuário anônimo para jogos de practice
    // Nota: Certifica-te que o caminho do import está correto
    const { addUser } = await import("./state/connections.js");
    const anonymousUser = {
      id: `anon_${socket.id}`,
      name: "Guest Player",
      token: null,
    };

    addUser(socket.id, anonymousUser);
    console.log(
      ` Usuário anônimo criado: ${anonymousUser.name} (Practice Mode)`,
    );
  }

  // --- CORREÇÃO CRÍTICA AQUI ---
  // 1. Primeiro carregamos o Jogo (Para detetar desistências ANTES de apagar o user)
  gameHandlers(io, socket);

  // 2. Depois carregamos as Conexões (Para apagar o user da memória)
  connectionsHandlers(io, socket);
  // -----------------------------
});

console.log(" Servidor Bisca na porta 3000...");
