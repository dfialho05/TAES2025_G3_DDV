import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Configuração centralizada do servidor
 */
export const config = {
  // Servidor
  server: {
    id: process.env.SERVER_ID || `websocket-server-${process.pid}`,
    port: parseInt(process.env.WEBSOCKET_PORT) || 3000,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    debug: process.env.REDIS_DEBUG === "true",
  },

  // Watchdog
  watchdog: {
    interval: parseInt(process.env.WATCHDOG_INTERVAL) || 30000,
    gameTimeout: parseInt(process.env.GAME_TIMEOUT_MS) || 120000,
    maxGameDuration: parseInt(process.env.MAX_GAME_DURATION_MS) || 3600000,
    heartbeatTTL: parseInt(process.env.HEARTBEAT_TTL) || 180,
  },

  // Laravel API
  laravel: {
    apiUrl: process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api",
    timeout: parseInt(process.env.API_TIMEOUT) || 5000,
  },

  // Sincronização
  sync: {
    interval: parseInt(process.env.SYNC_INTERVAL) || 10000,
    defaultGameTTL: parseInt(process.env.DEFAULT_GAME_TTL) || 7200,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

/**
 * Valida a configuração e exibe avisos
 */
export const validateConfig = () => {
  const warnings = [];
  const errors = [];

  // Verificar Redis
  if (!config.redis.host) {
    errors.push("REDIS_HOST não está definido");
  }

  // Verificar intervalos
  if (config.watchdog.interval < 10000) {
    warnings.push(
      "WATCHDOG_INTERVAL muito baixo (< 10s) - pode sobrecarregar o sistema",
    );
  }

  if (config.sync.interval < 5000) {
    warnings.push(
      "SYNC_INTERVAL muito baixo (< 5s) - pode sobrecarregar o Redis",
    );
  }

  // Verificar timeouts
  if (config.watchdog.gameTimeout > config.watchdog.maxGameDuration) {
    errors.push(
      "GAME_TIMEOUT_MS não pode ser maior que MAX_GAME_DURATION_MS",
    );
  }

  // Exibir avisos
  if (warnings.length > 0) {
    console.warn("\n⚠️  [Config] Avisos de configuração:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  // Exibir erros
  if (errors.length > 0) {
    console.error("\n❌ [Config] Erros de configuração:");
    errors.forEach((e) => console.error(`   - ${e}`));
    return false;
  }

  return true;
};

/**
 * Exibe a configuração atual (sem mostrar senhas)
 */
export const printConfig = () => {
  console.log("\n📋 [Config] Configuração carregada:");
  console.log(`   Server ID: ${config.server.id}`);
  console.log(`   Server Port: ${config.server.port}`);
  console.log(`   Redis Host: ${config.redis.host}:${config.redis.port}`);
  console.log(
    `   Redis Password: ${config.redis.password ? "***" : "não definida"}`,
  );
  console.log(`   Redis DB: ${config.redis.db}`);
  console.log(
    `   Watchdog Interval: ${config.watchdog.interval / 1000}s`,
  );
  console.log(
    `   Game Timeout: ${config.watchdog.gameTimeout / 1000}s`,
  );
  console.log(
    `   Max Game Duration: ${config.watchdog.maxGameDuration / 60000}min`,
  );
  console.log(`   Sync Interval: ${config.sync.interval / 1000}s`);
  console.log(`   Laravel API: ${config.laravel.apiUrl}`);
  console.log(`   Log Level: ${config.logging.level}\n`);
};

// Exportar configuração como default
export default config;
