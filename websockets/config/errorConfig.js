// Error handling configuration
// Centralized configuration for error protection system

export const errorConfig = {
  // Logging settings
  logging: {
    enabled: true,
    logToFile: true,
    logToConsole: true,
    maxLogSize: 1000, // Maximum errors to keep in memory
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logFilePath: './logs/errors.log',
    rotateLogDaily: true
  },

  // Recovery settings
  recovery: {
    enabled: true,
    maxRecoveryAttempts: 3,
    recoveryTimeout: 5000, // 5 seconds
    backupGameStates: true,
    maxBackupAge: 300000, // 5 minutes
    autoCleanupBackups: true
  },

  // Error thresholds
  thresholds: {
    maxErrorsPerMinute: 10,
    maxErrorsPer24Hours: 100,
    criticalErrorThreshold: 50,
    systemHealthThreshold: 75
  },

  // Notification settings
  notifications: {
    notifyClientsOnRecoverableErrors: true,
    notifyClientsOnCriticalErrors: true,
    showErrorDetails: false, // Set to true for development
    includeStackTrace: false, // Set to true for development
    gracefulErrorMessages: true
  },

  // Socket protection
  socketProtection: {
    enabled: true,
    wrapAllHandlers: true,
    enableSafeEmit: true,
    protectEventHandlers: true,
    maxHandlerExecutionTime: 30000 // 30 seconds
  },

  // Game protection
  gameProtection: {
    enabled: true,
    backupStateOnActions: true,
    validateGameStateAfterActions: true,
    fallbackBotBehavior: true,
    timeoutProtection: true,
    cardPlayValidation: true
  },

  // Multiplayer protection
  multiplayerProtection: {
    enabled: true,
    roomStateBackup: true,
    playerDisconnectionRecovery: true,
    chatErrorHandling: true,
    spectatorErrorHandling: true
  },

  // Development vs Production
  development: {
    verboseLogging: true,
    showStackTraces: true,
    detailedErrorMessages: true,
    enableDebugEndpoints: true,
    logAllEvents: false
  },

  production: {
    verboseLogging: false,
    showStackTraces: false,
    detailedErrorMessages: false,
    enableDebugEndpoints: false,
    logAllEvents: false
  },

  // Error categories and their handling
  errorCategories: {
    // Non-critical errors that should allow game to continue
    recoverable: [
      'ValidationError',
      'GameError',
      'ChatError',
      'TimerError',
      'CardPlayError',
      'UserInputError'
    ],

    // Critical errors that might require more aggressive recovery
    critical: [
      'OutOfMemoryError',
      'DatabaseError',
      'NetworkError',
      'SystemError'
    ],

    // Errors that should cause immediate attention but not crash
    warning: [
      'ConnectionTimeout',
      'PlayerDisconnection',
      'RoomNotFound',
      'GameNotFound'
    ]
  },

  // Retry policies for different operations
  retryPolicies: {
    gameActions: {
      maxRetries: 2,
      retryDelay: 1000,
      exponentialBackoff: true
    },

    networkOperations: {
      maxRetries: 3,
      retryDelay: 2000,
      exponentialBackoff: true
    },

    databaseOperations: {
      maxRetries: 5,
      retryDelay: 500,
      exponentialBackoff: true
    }
  },

  // Monitoring and health check
  monitoring: {
    enabled: true,
    healthCheckInterval: 300000, // 5 minutes
    errorStatisticsInterval: 60000, // 1 minute
    cleanupInterval: 3600000, // 1 hour
    alertOnSystemDegradation: true
  }
};

// Get configuration based on environment
export function getErrorConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = { ...errorConfig };

  if (env === 'production') {
    return {
      ...baseConfig,
      ...baseConfig.production,
      logging: {
        ...baseConfig.logging,
        logLevel: 'warn'
      },
      notifications: {
        ...baseConfig.notifications,
        showErrorDetails: false,
        includeStackTrace: false
      }
    };
  } else {
    return {
      ...baseConfig,
      ...baseConfig.development,
      logging: {
        ...baseConfig.logging,
        logLevel: 'debug'
      },
      notifications: {
        ...baseConfig.notifications,
        showErrorDetails: true,
        includeStackTrace: true
      }
    };
  }
}

// Validate configuration
export function validateErrorConfig(config = errorConfig) {
  const errors = [];

  if (!config.logging || typeof config.logging.enabled !== 'boolean') {
    errors.push('Invalid logging configuration');
  }

  if (!config.recovery || typeof config.recovery.enabled !== 'boolean') {
    errors.push('Invalid recovery configuration');
  }

  if (!config.thresholds || typeof config.thresholds.maxErrorsPerMinute !== 'number') {
    errors.push('Invalid thresholds configuration');
  }

  if (errors.length > 0) {
    throw new Error('Configuração de erro inválida: ' + errors.join(', '));
  }

  return true;
}

export default errorConfig;
