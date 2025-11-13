// Error handler module for websocket server
// Provides centralized error handling and recovery mechanisms

import fs from 'fs';
import path from 'path';

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000; // Maximum number of errors to keep in memory
        this.logToFile = true;
        this.logFilePath = path.join(process.cwd(), 'logs', 'errors.log');

        // Ensure logs directory exists
        this.ensureLogDirectory();

        // Error statistics
        this.errorStats = {
            total: 0,
            byType: new Map(),
            byHandler: new Map(),
            last24h: []
        };
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (err) {
                console.error('Erro ao criar diretório de logs:', err);
                this.logToFile = false;
            }
        }
    }

    // Wrapper function to handle errors in socket event handlers
    wrapHandler(handlerName, handler) {
        return async (...args) => {
            try {
                const result = await handler(...args);
                return result;
            } catch (error) {
                this.handleError(error, handlerName, args);

                // Try to notify the client about the error without crashing
                const socket = args[0]; // Assuming first arg is often socket or has socket reference
                if (socket && typeof socket.emit === 'function') {
                    socket.emit('gameError', {
                        message: 'Ocorreu um erro interno. O jogo continua.',
                        recoverable: true,
                        timestamp: new Date().toISOString()
                    });
                }

                return { success: false, error: error.message, recovered: true };
            }
        };
    }

    // Main error handling function
    handleError(error, context = 'unknown', additionalData = null) {
        const errorInfo = {
            message: error.message || 'Erro desconhecido',
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            additionalData: this.sanitizeData(additionalData),
            errorType: error.constructor.name
        };

        // Update statistics
        this.updateErrorStats(errorInfo);

        // Log error
        this.logError(errorInfo);

        // Console output for development
        console.error(`[ERRO ${context}] ${error.message}`);
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }

        // Attempt recovery based on error type
        this.attemptRecovery(error, context);

        return errorInfo;
    }

    // Sanitize data before logging (remove sensitive information)
    sanitizeData(data) {
        if (!data) return null;

        try {
            const sanitized = JSON.parse(JSON.stringify(data));

            // Remove potential sensitive data
            if (Array.isArray(sanitized)) {
                return sanitized.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        delete item.password;
                        delete item.token;
                        delete item.sessionId;
                    }
                    return item;
                });
            } else if (typeof sanitized === 'object' && sanitized !== null) {
                delete sanitized.password;
                delete sanitized.token;
                delete sanitized.sessionId;
            }

            return sanitized;
        } catch (err) {
            return 'Dados não serializáveis';
        }
    }

    // Update error statistics
    updateErrorStats(errorInfo) {
        this.errorStats.total++;

        // Count by type
        const currentCount = this.errorStats.byType.get(errorInfo.errorType) || 0;
        this.errorStats.byType.set(errorInfo.errorType, currentCount + 1);

        // Count by handler
        const handlerCount = this.errorStats.byHandler.get(errorInfo.context) || 0;
        this.errorStats.byHandler.set(errorInfo.context, handlerCount + 1);

        // Add to 24h log
        this.errorStats.last24h.push({
            timestamp: errorInfo.timestamp,
            type: errorInfo.errorType,
            context: errorInfo.context
        });

        // Clean old entries (older than 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        this.errorStats.last24h = this.errorStats.last24h.filter(
            entry => entry.timestamp > oneDayAgo
        );
    }

    // Log error to memory and file
    logError(errorInfo) {
        // Add to memory log
        this.errorLog.push(errorInfo);

        // Maintain max log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Log to file
        if (this.logToFile) {
            try {
                const logEntry = `${errorInfo.timestamp} [${errorInfo.context}] ${errorInfo.errorType}: ${errorInfo.message}\n`;
                fs.appendFileSync(this.logFilePath, logEntry);
            } catch (err) {
                console.error('Erro ao escrever no arquivo de log:', err);
            }
        }
    }

    // Attempt to recover from errors
    attemptRecovery(error, context) {
        // Recovery strategies based on context
        switch (context) {
            case 'gameHandler':
                this.recoverGameState();
                break;
            case 'connectionHandler':
                this.recoverConnection();
                break;
            case 'multiplayerHandler':
                this.recoverMultiplayer();
                break;
            default:
                this.genericRecovery();
        }
    }

    // Game state recovery
    recoverGameState() {
        console.log('[RECOVERY] Tentando recuperar estado do jogo...');
        // Implementation would depend on game manager structure
        // Could involve validating game states, resetting corrupted data, etc.
    }

    // Connection recovery
    recoverConnection() {
        console.log('[RECOVERY] Tentando recuperar conexões...');
        // Could involve cleaning up dead connections, resetting connection managers, etc.
    }

    // Multiplayer recovery
    recoverMultiplayer() {
        console.log('[RECOVERY] Tentando recuperar sessões multiplayer...');
        // Could involve validating room states, cleaning up orphaned rooms, etc.
    }

    // Generic recovery
    genericRecovery() {
        console.log('[RECOVERY] Executando recuperação genérica...');
        // Force garbage collection if possible
        if (global.gc) {
            global.gc();
        }
    }

    // Safe emit function that won't crash if socket is disconnected
    safeEmit(socket, event, data) {
        try {
            if (socket && socket.connected && typeof socket.emit === 'function') {
                socket.emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            this.handleError(error, 'safeEmit', { event, dataType: typeof data });
            return false;
        }
    }

    // Safe emit to room
    safeEmitToRoom(io, roomId, event, data) {
        try {
            if (io && roomId && typeof io.to === 'function') {
                io.to(roomId).emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            this.handleError(error, 'safeEmitToRoom', { roomId, event, dataType: typeof data });
            return false;
        }
    }

    // Get error statistics
    getErrorStats() {
        return {
            total: this.errorStats.total,
            byType: Object.fromEntries(this.errorStats.byType),
            byHandler: Object.fromEntries(this.errorStats.byHandler),
            last24hCount: this.errorStats.last24h.length,
            recentErrors: this.errorLog.slice(-10) // Last 10 errors
        };
    }

    // Check if system is healthy
    isSystemHealthy() {
        const recent = this.errorStats.last24h.length;
        const threshold = 100; // Max errors in 24h before considering unhealthy

        return {
            healthy: recent < threshold,
            errorCount: recent,
            threshold,
            status: recent < threshold ? 'healthy' : 'degraded'
        };
    }

    // Clear error logs
    clearErrorLog() {
        this.errorLog = [];
        this.errorStats = {
            total: 0,
            byType: new Map(),
            byHandler: new Map(),
            last24h: []
        };

        console.log('Logs de erro limpos');
    }

    // Handle uncaught exceptions
    setupGlobalHandlers() {
        process.on('uncaughtException', (error) => {
            console.error('UNCAUGHT EXCEPTION:', error);
            this.handleError(error, 'uncaughtException');

            // Don't exit the process, try to continue
            console.log('Tentando continuar após exceção não capturada...');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('UNHANDLED REJECTION:', reason);
            this.handleError(new Error(reason), 'unhandledRejection', { promise });
        });
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Setup global error handlers
errorHandler.setupGlobalHandlers();

export default errorHandler;

// Export specific functions for convenience
export const {
    wrapHandler,
    handleError,
    safeEmit,
    safeEmitToRoom,
    getErrorStats,
    isSystemHealthy,
    clearErrorLog
} = errorHandler;
