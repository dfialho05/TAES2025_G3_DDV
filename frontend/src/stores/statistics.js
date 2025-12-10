import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAPIStore } from './api'

export const useStatisticsStore = defineStore('statistics', () => {
  // State
  const stats = ref({
    total_matches: 0,
    total_wins: 0,
    win_rate: 0,
  })

  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  const fetchUserStats = async (userId) => {
    // Reset de segurança antes de carregar
    error.value = null
    isLoading.value = true

    try {
      // Assume que o axios já tem o baseURL configurado globalmente.
      // Se não tiver, podes precisar de importar a URL base ou usar o apiStore.
      const response = await axios.get(`/users/${userId}/statistics`)

      stats.value = response.data
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      error.value = err.response?.data?.message || err.message || 'Erro desconhecido'

      // Em caso de erro, zerar os dados para não mostrar lixo
      stats.value = {
        total_matches: 0,
        total_wins: 0,
        win_rate: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Útil para limpar os dados quando sais da página ou trocas de user
  const resetStats = () => {
    stats.value = {
      total_matches: 0,
      total_wins: 0,
      win_rate: 0,
    }
    error.value = null
    isLoading.value = false
  }

  return {
    // State
    stats,
    isLoading,
    error,

    // Actions
    fetchUserStats,
    resetStats,
  }
})
