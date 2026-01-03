import Redis from "ioredis";

// Configuração do Redis
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
};

// Cliente Redis principal
export const redisClient = new Redis(REDIS_CONFIG);

// Cliente Redis para subscrições (Pub/Sub)
export const redisSubscriber = new Redis(REDIS_CONFIG);

// Cliente Redis para publicações (Pub/Sub)
export const redisPublisher = new Redis(REDIS_CONFIG);

// Event Handlers
redisClient.on("connect", () => {
  console.log("[Redis] Cliente principal conectado");
});

redisClient.on("ready", () => {
  console.log("[Redis] Cliente principal pronto");
});

redisClient.on("error", (err) => {
  console.error("[Redis] Erro no cliente principal:", err.message);
});

redisClient.on("close", () => {
  console.warn("[Redis] Conexão principal fechada");
});

redisSubscriber.on("connect", () => {
  console.log("[Redis] Subscriber conectado");
});

redisSubscriber.on("error", (err) => {
  console.error("[Redis] Erro no subscriber:", err.message);
});

redisPublisher.on("connect", () => {
  console.log("[Redis] Publisher conectado");
});

redisPublisher.on("error", (err) => {
  console.error("[Redis] Erro no publisher:", err.message);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("[Redis] Encerrando conexões...");
  try {
    await Promise.all([
      redisClient.quit(),
      redisSubscriber.quit(),
      redisPublisher.quit(),
    ]);
    console.log("✅ [Redis] Todas as conexões encerradas");
  } catch (error) {
    console.error("❌ [Redis] Erro ao encerrar:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Verificar saúde da conexão
export const checkRedisHealth = async () => {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("❌ [Redis] Health check falhou:", error.message);
    return false;
  }
};

// Exportar configuração para uso no adapter
export const getRedisConfig = () => REDIS_CONFIG;
