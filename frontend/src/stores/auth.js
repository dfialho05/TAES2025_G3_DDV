import { defineStore } from 'pinia'
import { ref, computed, inject } from 'vue'
import { useAPIStore } from './api'
import axios from 'axios' // OBRIGATÓRIO

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()
  const SERVER_BASE_URL = inject('serverBaseURL')
  const currentUser = ref(undefined)
  const initialized = ref(false)

  const isLoggedIn = computed(() => currentUser.value !== undefined)

  const login = async (credentials) => {
    // 1. Inicializar proteção CSRF
    await axios.get(`${SERVER_BASE_URL}/sanctum/csrf-cookie`)

    // 2. Tentar o login
    await apiStore.postLogin(credentials)

    // 3. Obter utilizador
    await getUser()

    return currentUser.value
  }

  const register = async (credentials) => {
    // 1. Inicializar proteção CSRF
    await axios.get(`${SERVER_BASE_URL}/sanctum/csrf-cookie`)

    // 2. Tentar o registo
    await apiStore.postRegister(credentials)

    // 3. Obter utilizador (já faz login automático no backend)
    await getUser()

    return currentUser.value
  }

  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined
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
    isLoggedIn,
    initialized,
    init,
    login,
    register,
    logout,
    isAdmin,
    isPlayer,
    getUser,
  }
})
