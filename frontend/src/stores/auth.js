import { defineStore } from 'pinia'
import { ref, computed, inject } from 'vue'
import { useAPIStore } from './api'
import axios from 'axios' // OBRIGATÓRIO

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshingToken = false
let tokenRefreshPromise = null

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()
  const SERVER_BASE_URL = inject('serverBaseURL')
  const currentUser = ref(undefined)
  const initialized = ref(false)
  const token = ref(localStorage.getItem('api_token') || null)

  const isLoggedIn = computed(() => currentUser.value !== undefined)

  /**
   * Refresh the API token using the current session.
   * This is called when a token expires (401 Token expired response).
   */
  const refreshToken = async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingToken) {
      return tokenRefreshPromise
    }

    isRefreshingToken = true
    console.log('[AuthStore] Refreshing expired token...')

    try {
      tokenRefreshPromise = apiStore.createApiToken()
      const newToken = await tokenRefreshPromise

      if (newToken) {
        token.value = newToken
        localStorage.setItem('api_token', newToken)
        console.log('[AuthStore] Token refreshed successfully:', newToken.substring(0, 20) + '...')
        return newToken
      } else {
        console.warn('[AuthStore] Failed to refresh token - session may be invalid')
        // Clear token and user if refresh fails
        token.value = null
        localStorage.removeItem('api_token')
        currentUser.value = undefined
        return null
      }
    } catch (err) {
      console.error('[AuthStore] Error refreshing token:', err)
      // Clear token and user on error
      token.value = null
      localStorage.removeItem('api_token')
      currentUser.value = undefined
      return null
    } finally {
      isRefreshingToken = false
      tokenRefreshPromise = null
    }
  }

  const login = async (credentials) => {
    // 1. Inicializar proteção CSRF
    await axios.get(`${SERVER_BASE_URL}/sanctum/csrf-cookie`)

    // 2. Tentar o login
    const response = await apiStore.postLogin(credentials)

    // 3. Guardar token API para WebSocket (fallback para criar via sessão se necessário)
    console.log('[AuthStore] Login response:', response.data)
    console.log('[AuthStore] Token presente?', response.data?.token ? 'SIM' : 'NÃO')

    if (response.data?.token) {
      token.value = response.data.token
      localStorage.setItem('api_token', response.data.token)
      console.log('[AuthStore] Token guardado:', response.data.token.substring(0, 20) + '...')
    } else {
      // Tentativa de fallback: se a API não retornou token, pedir ao backend um token via sessão (POST /api/token)
      try {
        console.warn(
          '[AuthStore] Token não retornado no login — tentando criar token via sessão...',
        )
        const createdToken = await apiStore.createApiToken()
        if (createdToken) {
          token.value = createdToken
          localStorage.setItem('api_token', createdToken)
          console.log(
            '[AuthStore] Token criado via /api/token e guardado:',
            createdToken.substring(0, 20) + '...',
          )
        } else {
          console.warn(
            '[AuthStore] AVISO: Falha ao criar token via /api/token — sem token API disponível',
          )
        }
      } catch (err) {
        console.error('[AuthStore] Erro ao criar token via /api/token:', err)
      }
    }

    // 4. Obter utilizador
    await getUser()

    return currentUser.value
  }

  const register = async (credentials) => {
    // 1. Inicializar proteção CSRF
    await axios.get(`${SERVER_BASE_URL}/sanctum/csrf-cookie`)

    // 2. Tentar o registo
    const response = await apiStore.postRegister(credentials)

    // 3. Guardar token API para WebSocket (fallback para criar via sessão se necessário)
    console.log('[AuthStore] Register response:', response.data)
    console.log('[AuthStore] Token presente?', response.data?.token ? 'SIM' : 'NÃO')

    if (response.data?.token) {
      token.value = response.data.token
      localStorage.setItem('api_token', response.data.token)
      console.log('[AuthStore] Token guardado:', response.data.token.substring(0, 20) + '...')
    } else {
      // Tentar criar token através do endpoint protegido por sessão (POST /api/token)
      try {
        console.warn(
          '[AuthStore] Token não retornado no register — tentando criar token via sessão...',
        )
        const createdToken = await apiStore.createApiToken()
        if (createdToken) {
          token.value = createdToken
          localStorage.setItem('api_token', createdToken)
          console.log(
            '[AuthStore] Token criado via /api/token e guardado:',
            createdToken.substring(0, 20) + '...',
          )
        } else {
          console.warn(
            '[AuthStore] AVISO: Falha ao criar token via /api/token — sem token API disponível',
          )
        }
      } catch (err) {
        console.error('[AuthStore] Erro ao criar token via /api/token:', err)
      }
    }

    // 4. Obter utilizador (já faz login automático no backend)
    await getUser()

    return currentUser.value
  }

  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined
    token.value = null
    localStorage.removeItem('api_token')
  }

  const getUser = async () => {
    try {
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data?.data || response.data
    } catch (err) {
      currentUser.value = undefined
      throw err
    }
  }

  const init = async () => {
    if (initialized.value) return
    try {
      await getUser()

      // If we have a valid session user but no API token stored, attempt to create one.
      // This ensures the WebSocket layer can authenticate server-side actions even when
      // the initial login/register flow didn't return a token directly.
      if (currentUser.value && !token.value) {
        try {
          console.log(
            '[AuthStore] Init: user session present but no api_token — requesting /api/token...',
          )
          const createdToken = await apiStore.createApiToken()
          if (createdToken) {
            token.value = createdToken
            localStorage.setItem('api_token', createdToken)
            console.log('[AuthStore] Init: API token created and stored.')
          } else {
            console.warn('[AuthStore] Init: /api/token did not return a token.')
          }
        } catch (err) {
          console.error('[AuthStore] Init: failed to create API token via /api/token', err)
        }
      }
    } catch (e) {
      currentUser.value = undefined
    } finally {
      initialized.value = true
    }
  }

  const isAdmin = computed(() => currentUser.value?.type === 'A')
  const isPlayer = computed(() => currentUser.value?.type === 'P')

  return {
    currentUser,
    token,
    isLoggedIn,
    initialized,
    init,
    login,
    register,
    logout,
    refreshToken,
    isAdmin,
    isPlayer,
    getUser,
  }
})
