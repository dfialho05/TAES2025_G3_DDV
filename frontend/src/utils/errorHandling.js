/**
 * Utilitários para tratamento de erros no frontend
 */

/**
 * Extrai mensagem de erro de diferentes tipos de resposta
 * @param {Error|Object} error - Erro capturado
 * @returns {string} - Mensagem de erro formatada
 */
export function getErrorMessage(error) {
  // Se é uma string, retorna diretamente
  if (typeof error === 'string') {
    return error
  }

  // Se tem response (erro de axios)
  if (error?.response) {
    const status = error.response.status
    const data = error.response.data

    // Mensagens específicas por status HTTP
    switch (status) {
      case 400:
        return data?.message || 'Dados inválidos enviados.'
      case 401:
        return 'Não autorizado. Faça login novamente.'
      case 403:
        return 'Acesso negado. Sem permissões suficientes.'
      case 404:
        return data?.message || 'Recurso não encontrado.'
      case 422:
        return (
          formatValidationErrors(data?.errors) || data?.message || 'Dados de validação inválidos.'
        )
      case 429:
        return 'Muitas tentativas. Tente novamente mais tarde.'
      case 500:
        return 'Erro interno do servidor. Tente novamente.'
      case 502:
        return 'Servidor indisponível temporariamente.'
      case 503:
        return 'Serviço em manutenção. Tente mais tarde.'
      default:
        return data?.message || `Erro HTTP ${status}`
    }
  }

  // Se é erro de rede/conexão
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Timeout na conexão. Verifique sua internet.'
  }

  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return 'Erro de rede. Verifique sua conexão.'
  }

  // Se tem message
  if (error?.message) {
    return error.message
  }

  // Fallback genérico
  return 'Erro desconhecido. Tente novamente.'
}

/**
 * Formata erros de validação Laravel
 * @param {Object} errors - Objeto de erros de validação
 * @returns {string} - String formatada com todos os erros
 */
function formatValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return null
  }

  const errorMessages = []

  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages)) {
      errorMessages.push(...messages)
    } else if (typeof messages === 'string') {
      errorMessages.push(messages)
    }
  }

  return errorMessages.length > 0 ? errorMessages.join(' ') : null
}

/**
 * Verifica se o erro é de conexão/rede
 * @param {Error} error - Erro capturado
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('timeout') ||
    !error?.response
  )
}

/**
 * Verifica se é erro do servidor (5xx)
 * @param {Error} error - Erro capturado
 * @returns {boolean}
 */
export function isServerError(error) {
  const status = error?.response?.status
  return status >= 500 && status < 600
}

/**
 * Verifica se é erro do cliente (4xx)
 * @param {Error} error - Erro capturado
 * @returns {boolean}
 */
export function isClientError(error) {
  const status = error?.response?.status
  return status >= 400 && status < 500
}

/**
 * Cria objeto de erro padronizado
 * @param {Error} error - Erro original
 * @param {string} context - Contexto onde ocorreu o erro
 * @returns {Object}
 */
export function createErrorObject(error, context = 'Unknown') {
  return {
    message: getErrorMessage(error),
    context,
    status: error?.response?.status || null,
    code: error?.code || null,
    isNetwork: isNetworkError(error),
    isServer: isServerError(error),
    isClient: isClientError(error),
    timestamp: new Date().toISOString(),
    original: error,
  }
}

/**
 * Logger de erros com diferentes níveis
 */
export const errorLogger = {
  /**
   * Log de erro simples
   * @param {string} message - Mensagem do erro
   * @param {Object} details - Detalhes adicionais
   */
  error(message, details = {}) {
    console.error(message, details)
  },

  /**
   * Log de warning
   * @param {string} message - Mensagem do warning
   * @param {Object} details - Detalhes adicionais
   */
  warn(message, details = {}) {
    console.warn(message, details)
  },

  /**
   * Log de info
   * @param {string} message - Mensagem informativa
   * @param {Object} details - Detalhes adicionais
   */
  info(message, details = {}) {
    console.log(message, details)
  },

  /**
   * Log de sucesso
   * @param {string} message - Mensagem de sucesso
   * @param {Object} details - Detalhes adicionais
   */
  success(message, details = {}) {
    console.log(message, details)
  },
}

/**
 * Wrapper para executar funções assíncronas com tratamento de erro
 * @param {Function} fn - Função assíncrona
 * @param {string} context - Contexto da operação
 * @returns {Promise<[Error|null, any]>} - [erro, resultado]
 */
export async function safeAsync(fn, context = 'Operation') {
  try {
    const result = await fn()
    return [null, result]
  } catch (error) {
    const errorObj = createErrorObject(error, context)
    errorLogger.error(`${context} failed`, errorObj)
    return [errorObj, null]
  }
}

/**
 * Retry de operações com backoff exponencial
 * @param {Function} fn - Função a ser executada
 * @param {Object} options - Opções de retry
 * @returns {Promise<any>}
 */
export async function retryOperation(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    context = 'Retry Operation',
  } = options

  let attempt = 1
  let delay = baseDelay

  while (attempt <= maxAttempts) {
    try {
      const result = await fn()
      if (attempt > 1) {
        errorLogger.success(`${context} succeeded on attempt ${attempt}`)
      }
      return result
    } catch (error) {
      if (attempt === maxAttempts) {
        errorLogger.error(`${context} failed after ${maxAttempts} attempts`, {
          error: getErrorMessage(error),
          attempts: maxAttempts,
        })
        throw error
      }

      errorLogger.warn(`${context} failed on attempt ${attempt}, retrying...`, {
        error: getErrorMessage(error),
        nextDelay: delay,
      })

      // Esperar antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Aumentar delay para próxima tentativa (backoff exponencial)
      delay = Math.min(delay * backoffMultiplier, maxDelay)
      attempt++
    }
  }
}

/**
 * Utilitário para debounce de funções (previne muitas chamadas)
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Utilitário para throttle de funções (limita frequência)
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Limite de tempo em ms
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export default {
  getErrorMessage,
  isNetworkError,
  isServerError,
  isClientError,
  createErrorObject,
  errorLogger,
  safeAsync,
  retryOperation,
  debounce,
  throttle,
}
