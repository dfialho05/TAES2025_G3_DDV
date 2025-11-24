import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)

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
    currentUser.value = response.data
  }

  const register = async (payload) => {
    const response = await apiStore.postRegister(payload)

    if (response?.data?.user) {
      currentUser.value = response.data.user
    } else {
      await getUser()
    }

    return response
  }

  return {
    currentUser,
    isLoggedIn,
    login,
    logout,
    getUser,
    register,
  }
})
