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
    await apiStore.postLogout()
    currentUser.value = undefined
  }

  const getUser = async () => {
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
  }

  const register = async (payload) => {
    // payload expected to match AuthController::register:
    // { name, email, password, nickname?, photo_avatar_filename? }
    const response = await apiStore.postRegister(payload)

    // If the register endpoint returns the created user, set currentUser directly.
    // Otherwise, attempt to fetch the authenticated user.
    if (response?.data?.user) {
      currentUser.value = response.data.user
    } else {
      await getUser()
    }

    return response
  }

  const deleteAccount = async () => {
    return axios.patch(`${API_BASE_URL}/users/me/deactivate`)
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
