import { Server } from "socket.io";
import { connectionsHandlers } from "./Handlers/connections.js";


// 1. Configuração do Servidor
const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


connectionsHandlers(io);

console.log("Servidor de Bisca a correr na porta 3000...");