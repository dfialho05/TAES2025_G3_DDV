import { defineStore } from 'pinia'
import { ref, inject } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useDeckStore = defineStore('deck', () => {

  const API_BASE_URL = inject('apiBaseURL') || '/api'

  const decks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchDecks = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      
      const url = `${API_BASE_URL}/store/decks`
      
      const response = await axios.get(url)
      
      decks.value = response.data.data
      
    } catch (err) {
      console.error("Erro ao carregar loja:", err)
      error.value = err.message || 'Erro ao carregar baralhos'
    } finally {
      isLoading.value = false
    }
  }

  // Comprar Baralho
  const buyDeck = async (deckId) => {
    const authStore = useAuthStore()
    isLoading.value = true
    error.value = null

    try {
      const url = `${API_BASE_URL}/store/buy`
      const response = await axios.post(url, { deck_id: deckId })

      // Atualizar o AuthStore imediatamente (UX)
      if (authStore.currentUser) {
        authStore.currentUser.coins_balance = response.data.balance
        
        // Garante a estrutura do objeto custom
        if (!authStore.currentUser.custom) authStore.currentUser.custom = {}
        authStore.currentUser.custom.decks = response.data.my_decks
      }

      return { success: true, message: response.data.message }

    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao processar compra"
      error.value = msg
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  // Equipar Baralho
  const equipDeck = async (deckId) => {
    const authStore = useAuthStore()
    isLoading.value = true
    
    try {
      const url = `${API_BASE_URL}/store/equip`
      const response = await axios.post(url, { deck_id: deckId })

      if (authStore.currentUser) {
        if (!authStore.currentUser.custom) authStore.currentUser.custom = {}
        authStore.currentUser.custom.active_deck_id = response.data.active_deck_id
      }

      return { success: true, message: "Baralho equipado com sucesso!" }

    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao equipar"
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    decks,
    isLoading,
    error,
    // Actions
    fetchDecks,
    buyDeck,
    equipDeck
  }
})