import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === "admin")

  function login(credentials) {
    // Mock login
    user.value = {
      id: 1,
      email: credentials.email,
      nickname: "Player123",
      name: "João Silva",
      avatar: "/diverse-user-avatars.png",
      coins: 150,
      role: credentials.email === "admin@bisca.com" ? "admin" : "user",
      stats: {
        gamesPlayed: 42,
        wins: 28,
        losses: 14,
        capotes: 5,
        bandeiras: 12,
      },
    }
    return true
  }

  function register(data) {
    // Mock register
    user.value = {
      id: Date.now(),
      email: data.email,
      nickname: data.nickname,
      name: data.name,
      avatar: data.avatar || "/diverse-user-avatars.png",
      coins: 50,
      role: "user",
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        capotes: 0,
        bandeiras: 0,
      },
    }
    return true
  }

  function logout() {
    user.value = null
  }

  function updateProfile(data) {
    if (user.value) {
      user.value = { ...user.value, ...data }
    }
  }

  function addCoins(amount) {
    if (user.value) {
      user.value.coins += amount
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    addCoins,
  }
})
