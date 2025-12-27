import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useLeaderboardStore = defineStore('leaderboards', () => {
  const apiStore = useAPIStore()

  // State
  const leaderboards = ref({
    mostWins: [],
    mostMatches: [],
    mostGames: [],
  })

  const isLoading = ref(false)
  const error = ref(null)
  const selectedPeriod = ref('all')
  const lastFetch = ref(null)

  // Getters/Computed
  const isEmpty = computed(() => {
    return (
      leaderboards.value.mostWins.length === 0 &&
      leaderboards.value.mostMatches.length === 0 &&
      leaderboards.value.mostGames.length === 0
    )
  })

  const periods = computed(() => [
    { value: 'all', label: 'All Time', emoji: '🏆' },
    { value: 'month', label: 'This Month', emoji: '📅' },
  ])

  const leaderboardTypes = computed(() => [
    {
      key: 'mostWins',
      title: 'Most Wins',
      emoji: '🏆',
      description: 'Players with the most victories',
    },
    {
      key: 'mostMatches',
      title: 'Most Matches',
      emoji: '🎯',
      description: 'Players who have played the most matches',
    },
    {
      key: 'mostGames',
      title: 'Most Games',
      emoji: '🎮',
      description: 'Players with the most individual games',
    },
  ])

  // Actions
  const fetchAllLeaderboards = async (period = 'all', limit = 5, force = false) => {
    // Avoid redundant API calls unless forced
    if (!force && isLoading.value) {
      return
    }

    // Check if we need to fetch (cache for 5 minutes)
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    if (
      !force &&
      lastFetch.value &&
      now - lastFetch.value < fiveMinutes &&
      selectedPeriod.value === period
    ) {
      return
    }

    isLoading.value = true
    error.value = null
    selectedPeriod.value = period

    try {
      console.log('Fetching leaderboards for period:', period, 'limit:', limit)
      const response = await apiStore.getLeaderboardsAll(period, limit)
      console.log('API Response:', response.data)

      // API response now matches our store structure
      leaderboards.value = {
        mostWins: response.data.leaderboards.most_wins?.data || [],
        mostMatches: response.data.leaderboards.most_matches?.data || [],
        mostGames: response.data.leaderboards.most_games?.data || [],
      }

      console.log('Updated leaderboards:', leaderboards.value)
      lastFetch.value = now
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch leaderboards'
      console.error('Leaderboard fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchSingleLeaderboard = async (type, period = 'all', limit = 10) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiStore.getLeaderboard(type, period, limit)
      return response.data.data || []
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch leaderboard'
      console.error('Single leaderboard fetch error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const changePeriod = async (newPeriod) => {
    if (newPeriod !== selectedPeriod.value) {
      selectedPeriod.value = newPeriod
      await fetchAllLeaderboards(newPeriod, 5, true)
    }
  }

  const refreshLeaderboards = async () => {
    await fetchAllLeaderboards(selectedPeriod.value, 5, true)
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    leaderboards.value = {
      mostWins: [],
      mostMatches: [],
      mostGames: [],
    }
    isLoading.value = false
    error.value = null
    selectedPeriod.value = 'all'
    lastFetch.value = null
  }

  // Helper functions
  const findUserInLeaderboards = (userId) => {
    const results = {}

    Object.entries(leaderboards.value).forEach(([key, entries]) => {
      const userEntry = entries.find((entry) => entry.id === userId)
      if (userEntry) {
        results[key] = userEntry
      }
    })

    return results
  }

  const getPositionClass = (position) => {
    switch (position) {
      case 1:
        return 'gold'
      case 2:
        return 'silver'
      case 3:
        return 'bronze'
      default:
        return 'regular'
    }
  }

  return {
    // State
    leaderboards,
    isLoading,
    error,
    selectedPeriod,
    lastFetch,

    // Getters
    isEmpty,
    periods,
    leaderboardTypes,

    // Actions
    fetchAllLeaderboards,
    fetchSingleLeaderboard,
    changePeriod,
    refreshLeaderboards,
    clearError,
    reset,

    // Helpers
    findUserInLeaderboards,
    getPositionClass,
  }
})
