import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)
  const initialized = ref(false)
  let initPromise = Promise.resolve()

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    await getUser()
  }

  const logout = async () => {
    // postLogout limpa sessionStorage (no api store) mesmo que a chamada ao servidor falhe
    await apiStore.postLogout()
    currentUser.value = undefined

    // Emit logout event to other tabs/windows (storage events only fire on other tabs)
    try {
      localStorage.setItem('logout', Date.now().toString())
    } catch (e) {
      // ignore storage errors
    }
  }

  const getUser = async () => {
    const response = await apiStore.getAuthUser()
    // Handle UserResource format: response.data.data contains the actual user data
    currentUser.value = response.data.data || response.data
  }

  const register = async (payload) => {
    const response = await apiStore.postRegister(payload)

    if (response?.data?.user) {
      // Handle UserResource format: response.data.user.data contains the actual user data
      currentUser.value = response.data.user.data || response.data.user
    } else {
      await getUser()
    }

    return response
  }

  // NEW: centraliza deleteAccount no auth store, delegando para apiStore
  const deleteAccount = async (current_password) => {
    // chama o endpoint que faz soft-delete no backend
    const response = await apiStore.postDeleteAccount(current_password)

    // após apagar, tenta efetuar logout localmente;
    // se o logout falhar com 401 (token já revogado) ignora, senão propaga.
    try {
      await logout()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        console.warn('Logout retornou 401 após remoção de conta — ignorando.')
      } else {
        throw err
      }
    }

    return response
  }

  // init: tenta repor sessão a partir do token em sessionStorage (se existir)
  // e marca initialized=true quando terminar (sucesso ou falha).
  const init = async () => {
    if (initialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      const SESSION_TOKEN_KEY = 'apiToken'
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
      if (token) {
        try {
          await getUser()
        } catch (e) {
          // token inválido / expirado -> limpa sessão local
          try {
            await apiStore.postLogout()
          } catch (e) {
            // ignore
          }
          currentUser.value = undefined
        }
      }
      initialized.value = true
      initPromise = null
    })()

    return initPromise
  }

  // Método para atualizar o usuário atual garantindo reatividade
  const updateUser = (updates) => {
    if (currentUser.value) {
      // Cria um novo objeto para garantir reatividade
      currentUser.value = { ...currentUser.value, ...updates }
    }
  }

  // Método para atualizar saldo de coins especificamente
  const updateCoinsBalance = (newBalance) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, coins_balance: newBalance }
    }
  }

  // Método para atualizar dados personalizados (como decks)
  const updateCustomData = (customUpdates) => {
    if (currentUser.value) {
      const newCustom = { ...currentUser.value.custom, ...customUpdates }
      currentUser.value = { ...currentUser.value, custom: newCustom }
    }
  }

  // Método para refrescar dados do usuário do servidor
  const refreshUser = async () => {
    if (currentUser.value) {
      try {
        await getUser()
      } catch (err) {
        console.error('Erro ao refrescar dados do usuário:', err)
        throw err
      }
    }
  }

  return {
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
