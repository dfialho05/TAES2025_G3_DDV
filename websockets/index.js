import { Server } from "socket.io";
import { connectionsHandlers } from "./events/connections.js";
import { gameHandlers } from "./events/game.js"; 

const io = new Server(3000, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
    // CAPTURAR TOKEN
    const token = socket.handshake.auth.token;
    socket.data.token = token; // Guarda no socket para uso posterior

    if(token) console.log(`🔌 Socket ${socket.id} ligado COM Token.`);
    else console.log(`⚠️ Socket ${socket.id} ligado SEM Token.`);

    connectionsHandlers(io, socket);
    gameHandlers(io, socket);
});

console.log("🚀 Servidor Bisca na porta 3000...");