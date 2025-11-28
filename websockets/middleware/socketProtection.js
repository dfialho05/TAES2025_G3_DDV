// Socket protection middleware
// Wraps all socket event handlers with error protection

import errorHandler from '../core/errorHandler.js';

class SocketProtection {
    constructor() {
        this.protectedSockets = new Set();
        this.eventStats = new Map();
    }

    // Protect a socket by wrapping all its event handlers
    protectSocket(socket) {
        if (this.protectedSockets.has(socket.id)) {
            return; // Already protected
        }

        // Store original emit function
        const originalEmit = socket.emit.bind(socket);

        // Replace emit with safe version
        socket.emit = (event, ...args) => {
            return errorHandler.safeEmit({ emit: originalEmit, connected: socket.connected }, event, ...args);
        };

        // Store original on function
        const originalOn = socket.on.bind(socket);

        // Replace on with protected version
        socket.on = (event, handler) => {
            const protectedHandler = this.createProtectedHandler(event, handler, socket);
            return originalOn(event, protectedHandler);
        };

        // Store original once function
        const originalOnce = socket.once.bind(socket);

        // Replace once with protected version
        socket.once = (event, handler) => {
            const protectedHandler = this.createProtectedHandler(event, handler, socket);
            return originalOnce(event, protectedHandler);
        };

        this.protectedSockets.add(socket.id);

        // Clean up when socket disconnects
        socket.on('disconnect', () => {
            this.protectedSockets.delete(socket.id);
        });

        console.log(`Socket ${socket.id} protegido contra erros`);
    }

    // Create a protected version of an event handler
    createProtectedHandler(eventName, originalHandler, socket) {
        return async (...args) => {
            const startTime = Date.now();

            try {
                // Update event statistics
                this.updateEventStats(eventName, 'attempt');

                // Execute original handler
                const result = await originalHandler(...args);

                // Update success statistics
                this.updateEventStats(eventName, 'success');

                return result;

            } catch (error) {
                // Update error statistics
                this.updateEventStats(eventName, 'error');

                // Handle the error
                const errorInfo = errorHandler.handleError(error, `socketEvent:${eventName}`, {
                    socketId: socket.id,
                    eventName,
                    argsCount: args.length,
                    executionTime: Date.now() - startTime
                });

                // Try to notify client about recoverable error
                try {
                    if (this.isRecoverableError(error)) {
                        socket.emit('gameWarning', {
                            message: 'Ocorreu um erro, mas o jogo continua normalmente.',
                            event: eventName,
                            timestamp: new Date().toISOString(),
                            recoverable: true
                        });
                    } else {
                        socket.emit('gameError', {
                            message: 'Ocorreu um erro interno. Tente novamente.',
                            event: eventName,
                            timestamp: new Date().toISOString(),
                            recoverable: false
                        });
                    }
                } catch (emitError) {
                    console.error('Erro ao tentar notificar cliente sobre erro:', emitError);
                }

                // Return error result instead of throwing
                return {
                    success: false,
                    error: error.message,
                    recovered: true,
                    errorInfo: errorInfo
                };
            }
        };
    }

    // Update event statistics
    updateEventStats(eventName, type) {
        if (!this.eventStats.has(eventName)) {
            this.eventStats.set(eventName, {
                attempts: 0,
                successes: 0,
                errors: 0,
                lastActivity: null
            });
        }

        const stats = this.eventStats.get(eventName);
        stats[type === 'attempt' ? 'attempts' : (type === 'success' ? 'successes' : 'errors')]++;
        stats.lastActivity = new Date().toISOString();
    }

    // Check if error is recoverable
    isRecoverableError(error) {
        const recoverableErrors = [
            'TypeError',
            'ReferenceError',
            'ValidationError',
            'GameError'
        ];

        const nonRecoverableErrors = [
            'OutOfMemoryError',
            'SystemError',
            'ECONNRESET',
            'ETIMEDOUT'
        ];

        const errorType = error.constructor.name;
        const errorMessage = error.message.toLowerCase();

        // Check for non-recoverable patterns
        for (const pattern of nonRecoverableErrors) {
            if (errorMessage.includes(pattern.toLowerCase()) || errorType === pattern) {
                return false;
            }
        }

        // Check for recoverable patterns
        for (const pattern of recoverableErrors) {
            if (errorType === pattern) {
                return true;
            }
        }

        // Default to recoverable for unknown errors
        return true;
    }

    // Get protection statistics
    getProtectionStats() {
        return {
            protectedSockets: this.protectedSockets.size,
            eventStats: Object.fromEntries(this.eventStats),
            totalEvents: Array.from(this.eventStats.values()).reduce(
                (sum, stats) => sum + stats.attempts, 0
            ),
            totalErrors: Array.from(this.eventStats.values()).reduce(
                (sum, stats) => sum + stats.errors, 0
            )
        };
    }

    // Create a protected wrapper for any function
    createProtectedFunction(functionName, originalFunction, context = {}) {
        return async (...args) => {
            try {
                return await originalFunction(...args);
            } catch (error) {
                errorHandler.handleError(error, functionName, {
                    context,
                    argsCount: args.length
                });

                // Return safe fallback
                return {
                    success: false,
                    error: error.message,
                    recovered: true
                };
            }
        };
    }

    // Protect an entire object's methods
    protectObject(obj, objectName = 'unknown') {
        const protectedObj = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'function') {
                protectedObj[key] = this.createProtectedFunction(
                    `${objectName}.${key}`,
                    value.bind(obj),
                    { objectName, methodName: key }
                );
            } else {
                protectedObj[key] = value;
            }
        }

        return protectedObj;
    }

    // Reset statistics
    resetStats() {
        this.eventStats.clear();
        console.log('Estatísticas de proteção resetadas');
    }
}

// Create singleton instance
const socketProtection = new SocketProtection();

export default socketProtection;

// Export specific methods
export const {
    protectSocket,
    createProtectedHandler,
    createProtectedFunction,
    protectObject,
    getProtectionStats,
    resetStats
} = socketProtection;
