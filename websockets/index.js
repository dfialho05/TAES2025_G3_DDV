import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { connectionsHandlers } from "./events/connections.js";
import { gameHandlers } from "./events/game.js";
import {
  redisPublisher,
  redisSubscriber,
  checkRedisHealth,
} from "./redis/client.js";
import {
  recoverAllGamesOnStartup,
  startPeriodicSync,
  handleClientReconnection,
} from "./redis/recoveryManager.js";
import { startWatchdog } from "./workers/watchdog.js";
import { getRawGames } from "./state/game.js";
import { authMiddleware } from "./middleware/auth.js";

const io = new Server(3000, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.adapter(createAdapter(redisPublisher, redisSubscriber));

console.log("[Socket.IO] Redis Adapter configurado para multi-node support");

global.io = io;

io.use(authMiddleware);
console.log("[Socket.IO] Middleware de autenticação configurado");

// Inicialização assíncrona do servidor
async function initializeServer() {
  try {
    // Verificar saúde do Redis
    const redisHealthy = await checkRedisHealth();
    if (!redisHealthy) {
      console.error(
        "[Redis] Não foi possível conectar ao Redis. Verifique se o serviço está rodando.",
      );
      process.exit(1);
    }
    console.log("[Redis] Conexão estabelecida e saudável");

    // Recuperar jogos ativos após reinício do servidor
    const gamesMap = getRawGames();
    await recoverAllGamesOnStartup(io, gamesMap);

    // Iniciar sincronização periódica dos jogos para Redis
    startPeriodicSync(gamesMap, 10000); // 10 segundos
    console.log("[Recovery] Sincronização periódica iniciada");

    // Iniciar Watchdog Worker para monitorar timeouts
    startWatchdog();
    console.log("[Watchdog] Worker iniciado");

    io.on("connection", async (socket) => {
      const user = socket.data.user;
      const isGuest = socket.data.isGuest;

      if (user) {
        console.log(
          `[Connection] Socket ${socket.id} conectado: ${user.name} (ID: ${user.id})`,
        );
      } else if (isGuest) {
        console.log(
          `[Connection] Socket ${socket.id} conectado como GUEST (Practice Mode)`,
        );

        const { addUser } = await import("./state/connections.js");
        const anonymousUser = {
          id: `guest_${socket.id}`,
          name: `Guest ${socket.id.substring(0, 4)}`,
          token: null,
          isGuest: true,
        };

        addUser(socket.id, anonymousUser);
        socket.data.user = anonymousUser;
      }

      await handleClientReconnection(socket, io);

      gameHandlers(io, socket);
      connectionsHandlers(io, socket);
    });

    console.log("\nServidor Bisca rodando na porta 3000");
    console.log("Funcionalidades ativas:");
    console.log("WebSocket Server");
    console.log("Redis Adapter (Multi-node support)");
    console.log("Recovery System (Reconexão automática)");
    console.log("Watchdog Worker (Monitoramento de timeouts)");
    console.log("Periodic Sync (Estado para Redis a cada 10s)");
    console.log("\n");

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\n[Server] Iniciando shutdown gracioso...");

      // Parar novos jogos
      io.close();

      console.log("[Server] Shutdown completo\n");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Server] Erro fatal na inicialização:", error.message);
    process.exit(1);
  }
}

// Inicializar servidor
initializeServer();
