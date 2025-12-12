import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  // 1. Variável reativa para o token (lê do sítio certo: sessionStorage 'apiToken')
  const token = ref(sessionStorage.getItem('apiToken'))

  const currentUser = ref(undefined)
  const initialized = ref(false)
  let initPromise = Promise.resolve()

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)

    // 2. Atualizar o token reativo após login com sucesso
    token.value = sessionStorage.getItem('apiToken')

    await getUser()
  }

  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined

    // 3. Limpar token reativo
    token.value = null

    try {
      localStorage.setItem('logout', Date.now().toString())
    } catch (e) { }
  }

  const getUser = async () => {
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data.data || response.data
  }

  const register = async (payload) => {
    const response = await apiStore.postRegister(payload)
    if (response?.data?.user) {
      currentUser.value = response.data.user.data || response.data.user
      // Atualizar token também no registo se o backend o devolver logo
      token.value = sessionStorage.getItem('apiToken')
    } else {
      await getUser()
    }
    return response
  }

  const deleteAccount = async (current_password) => {
    const response = await apiStore.postDeleteAccount(current_password)
    try {
      await logout()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) console.warn('Ignorando 401 no logout')
      else throw err
    }
    return response
  }

  const init = async () => {
    if (initialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      const SESSION_TOKEN_KEY = 'apiToken'
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY)

      // Sincronizar estado inicial
      if (storedToken) token.value = storedToken;

      if (storedToken) {
        try {
          await getUser()
        } catch (e) {
          try { await apiStore.postLogout() } catch (e) {}
          currentUser.value = undefined
          token.value = null
        }
      }
      initialized.value = true
      initPromise = null
    })()

    return initPromise
  }

  const updateUser = (updates) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...updates }
    }
  }

  const updateCoinsBalance = (newBalance) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, coins_balance: newBalance }
    }
  }

  const updateCustomData = (customUpdates) => {
    if (currentUser.value) {
      const newCustom = { ...currentUser.value.custom, ...customUpdates }
      currentUser.value = { ...currentUser.value, custom: newCustom }
    }
  }

  const refreshUser = async () => {
    if (currentUser.value) {
      try { await getUser() } catch (err) { throw err }
    }
  }

  return {
    token, // <--- IMPORTANTE: Exportar o token para o socket usar
    currentUser,
    isLoggedIn,
    initialized,
    init,
    login,
    logout,
    getUser,
    register,
    deleteAccount,
    updateUser,
    updateCoinsBalance,
    updateCustomData,
    refreshUser,
  }
})
