// index.js (ou server.js)
import { Server } from "socket.io";
import { connectionsHandlers } from "./events/connections.js";
import { gameHandlers } from "./events/game.js"; 

// 2. Configuração do Servidor
const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 3. Bloco Principal de Conexão
// É aqui que tudo começa. Quando um browser se liga...
io.on("connection", (socket) => {

    connectionsHandlers(io, socket);

    gameHandlers(io, socket);
});

console.log("Servidor de Bisca a correr na porta 3000...");