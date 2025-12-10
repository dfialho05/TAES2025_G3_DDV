import { defineStore } from 'pinia'
import { ref, inject, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useDeckStore = defineStore('deck', () => {
  const API_BASE_URL = inject('apiBaseURL') || '/api'

  const decks = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const deckAssets = ref({}) // Cache das imagens dos decks

  // Getters computados
  const activeDeck = computed(() => {
    const authStore = useAuthStore()
    const activeDeckId = authStore.currentUser?.custom?.active_deck_id || 1

    // FIX: Usar '==' para permitir comparação entre string e number
    return decks.value.find((deck) => deck.id == activeDeckId) || decks.value[0]
  })

  const ownedDecks = computed(() => {
    const authStore = useAuthStore()
    const myDecks = authStore.currentUser?.custom?.decks || []
    // FIX: Usar '==' aqui também por segurança
    return decks.value.filter((deck) => myDecks.includes(deck.id) || deck.id == 1)
  })

  const fetchDecks = async () => {
    isLoading.value = true
    error.value = null

    try {
      const url = `${API_BASE_URL}/decks`
      const response = await axios.get(url)
      decks.value = response.data.data
    } catch (err) {
      console.error('Erro ao carregar decks:', err)
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

        if (!authStore.currentUser.custom) authStore.currentUser.custom = {}
        authStore.currentUser.custom.decks = response.data.my_decks
      }

      return { success: true, message: response.data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao processar compra'
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

      // Limpar cache de assets do deck anterior
      deckAssets.value = {}

      return { success: true, message: response.data.message || 'Baralho equipado com sucesso!' }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao equipar'
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  // Carregar assets de um deck específico
  const loadDeckAssets = async (deckSlug) => {
    if (deckAssets.value[deckSlug]) {
      return deckAssets.value[deckSlug]
    }

    try {
      const url = `${API_BASE_URL}/decks/${deckSlug}/assets`
      const response = await axios.get(url)

      deckAssets.value[deckSlug] = response.data.cards
      return response.data.cards
    } catch (err) {
      console.error('Erro ao carregar assets do deck:', err)
      return {}
    }
  }

  // Pré-carregar imagens do deck ativo
  const preloadActiveDeckImages = async () => {
    if (activeDeck.value?.slug) {
      await loadDeckAssets(activeDeck.value.slug)
    }
  }

  // Obter URL de uma carta específica
  const getCardImageUrl = (deckSlug, cardName) => {
    return `${API_BASE_URL}/decks/${deckSlug}/image/${cardName}`
  }

  // Obter URL do preview de um deck
  const getDeckPreviewUrl = (deckSlug) => {
    return `${API_BASE_URL}/decks/${deckSlug}/image/preview.png`
  }

  return {
    // State
    decks,
    isLoading,
    error,
    deckAssets,
    // Getters
    activeDeck,
    ownedDecks,
    // Actions
    fetchDecks,
    buyDeck,
    equipDeck,
    loadDeckAssets,
    preloadActiveDeckImages,
    getCardImageUrl,
    getDeckPreviewUrl,
  }
})
