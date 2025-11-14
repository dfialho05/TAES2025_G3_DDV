// Configurações do servidor WebSocket do jogo de cartas
// Funcionalidades: Timer de jogadas, Visualização do bot, etc.

const config = {
  // Configurações do servidor
  server: {
    port: 3000,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  },

  // Configurações do timer de jogadas
  timer: {
    // Tempo limite para cada jogada em milissegundos (5 minutos = 300000ms)
    turnTimeLimit: 5 * 60 * 1000,

    // Intervalo de atualização do timer enviado aos clientes (10 segundos)
    updateInterval: 10 * 1000,

    // Intervalo de atualização visual no cliente (1 segundo)
    clientUpdateInterval: 1000,

    // Avisos de tempo
    warningTime: 60 * 1000, // Aviso quando restam 1 minuto
    dangerTime: 30 * 1000, // Perigo quando restam 30 segundos

    // Ativar/desativar timer automático
    enabled: true,

    // Tempo de atraso antes de iniciar timer após eventos (em ms)
    startDelay: 1000,
  },

  // Configurações da visualização do bot
  bot: {
    // Tempo que a carta do bot fica visível após rodada (3 segundos)
    cardDisplayTime: 3 * 1000,

    // Tempo de atraso para simular "pensamento" do bot
    thinkingTime: 1000,

    // Ativar/desativar visualização da carta do bot
    showCard: true,

    // Ativar/desativar animações da carta do bot
    animations: true,

    // Configurações de confirmação e retry do bot
    confirmation: {
      // Tempo limite para o bot responder (10 segundos)
      responseTimeout: 10 * 1000,

      // Número máximo de tentativas se o bot falhar
      maxRetries: 3,

      // Ativar sistema de confirmação e retry
      enabled: true,

      // Delay entre tentativas (com backoff exponencial)
      retryBaseDelay: 2000,

      // Delay máximo entre tentativas
      maxRetryDelay: 8000,
    },

    // Mensagens do bot
    messages: {
      thinking: "Pensando...",
      waiting: "Aguardando jogada...",
      played: "Bot jogou:",
      retrying: "Bot tentando novamente...",
      failed: "Bot falhou após várias tentativas",
    },
  },

  // Configurações do jogo
  game: {
    // Número de cartas por jogador
    cardsPerPlayer: 9,

    // Tempo padrão de turno (usado como fallback)
    defaultTurnTime: 30,

    // Ativar/desativar modo debug
    debug: false,

    // Configurações de reconexão
    reconnection: {
      timeout: 2 * 60 * 1000, // 2 minutos para reconectar
      enabled: true,
    },
  },

  // Configurações de limpeza automática
  cleanup: {
    // Intervalo de limpeza de sessões expiradas (5 minutos)
    sessionCleanupInterval: 5 * 60 * 1000,

    // Tempo de expiração de sessão (1 hora)
    sessionTimeout: 60 * 60 * 1000,

    // Ativar limpeza automática
    enabled: true,
  },

  // Configurações de logging
  logging: {
    // Nível de log (debug, info, warn, error)
    level: "info",

    // Ativar logs do timer
    timerLogs: true,

    // Ativar logs do bot
    botLogs: true,

    // Ativar logs de conexão
    connectionLogs: true,

    // Formato de timestamp
    timestampFormat: "HH:mm:ss",
  },

  // Configurações de performance
  performance: {
    // Máximo de jogos simultâneos
    maxConcurrentGames: 100,

    // Máximo de conexões por IP
    maxConnectionsPerIP: 5,

    // Timeout de conexão inativa (10 minutos)
    connectionTimeout: 10 * 60 * 1000,
  },

  // Configurações da interface
  ui: {
    // Cores do timer
    timerColors: {
      normal: "#e3f2fd",
      warning: "#fff3cd",
      danger: "#f8d7da",
    },

    // Configurações da carta do bot
    botCard: {
      // Duração da animação de escala (300ms)
      animationDuration: 300,

      // Escala da animação (1.1 = 110%)
      animationScale: 1.1,
    },

    // Configurações de responsividade
    responsive: {
      // Breakpoint para mobile
      mobileBreakpoint: 768,
    },
  },

  // Funcionalidades experimentais
  experimental: {
    // Ativar sugestões automáticas
    autoSuggestions: false,

    // Ativar análise de jogadas
    playAnalysis: false,

    // Ativar estatísticas avançadas
    advancedStats: false,
  },
};

// Função para validar configurações
const validateConfig = () => {
  const errors = [];

  if (config.timer.turnTimeLimit < 5000) {
    errors.push("Timer muito baixo: mínimo 5 segundos");
  }

  if (config.timer.turnTimeLimit > 10 * 60 * 1000) {
    errors.push("Timer muito alto: máximo 10 minutos");
  }

  if (config.bot.cardDisplayTime < 1000) {
    errors.push("Tempo de exibição da carta do bot muito baixo");
  }

  if (config.performance.maxConcurrentGames < 1) {
    errors.push("Número máximo de jogos deve ser pelo menos 1");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Função para obter configuração com override
const getConfig = (overrides = {}) => {
  return {
    ...config,
    ...overrides,
  };
};

// Função para atualizar configuração em runtime
const updateConfig = (path, value) => {
  const paths = path.split(".");
  let current = config;

  for (let i = 0; i < paths.length - 1; i++) {
    if (!current[paths[i]]) {
      current[paths[i]] = {};
    }
    current = current[paths[i]];
  }

  current[paths[paths.length - 1]] = value;

  console.log(`Configuração atualizada: ${path} = ${value}`);
};

// Exportar configurações e funções utilitárias
export { config, validateConfig, getConfig, updateConfig };

// Export default para compatibilidade
export default config;
