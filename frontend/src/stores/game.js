import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAPIStore } from './api'
import { useAuthStore } from './auth'

export const useGameStore = defineStore('game', () => {
  const apiStore = useAPIStore()
  const authStore = useAuthStore()

  const difficulties = ref([
    { value: 'easy', label: 'Easy', description: '4x2 grid' },
    { value: 'medium', label: 'Medium', description: '4x3 grid' },
    { value: 'hard', label: 'Hard', description: '4x4 grid' },
  ])
  const difficulty = ref('medium')

  const options = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
    return { face: i, matched: false, flipped: false }
  })
  const cards = ref([])
  const flippedCards = ref([])
  const matchedPairs = ref([])
  const moves = ref(0)
  const beganAt = ref(undefined)
  const endedAt = ref(undefined)
  const selectedTheme = ref(null)

  const isGameComplete = computed(() => {
    if (cards.value.length === 0) return false
    return matchedPairs.value.length === cards.value.length
  })

  const setBoard = () => {
    cards.value = []
    flippedCards.value = []
    matchedPairs.value = []

    moves.value = 0

    let numPairs = 4
    if (difficulty.value === 'medium') numPairs = 6
    if (difficulty.value === 'hard') numPairs = 8

    const boardOptions = options.slice(0, numPairs)

    let idCounter = 0
    boardOptions.forEach((option, index) => {
      const imageUrl = selectedTheme.value?.cards?.[index]?.face_image_url || null

      cards.value.push({ id: idCounter++, ...option, imageUrl })
      cards.value.push({ id: idCounter++, ...option, imageUrl })
    })

    for (let i = cards.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cards.value[i], cards.value[j]] = [cards.value[j], cards.value[i]]
    }

    beganAt.value = new Date()
  }

  const flipCard = (card) => {
    if (flippedCards.value.includes(card.id)) return
    if (matchedPairs.value.includes(card.id)) return
    if (flippedCards.value.length >= 2) return

    flippedCards.value.push(card.id)
    card.flipped = true
    if (flippedCards.value.length == 2) {
      moves.value++
      checkForMatch()
    }
  }

  const checkForMatch = () => {
    if (flippedCards.value.length !== 2) return

    const [first, second] = flippedCards.value
    const firstCard = cards.value.find((c) => c.id === first)
    const secondCard = cards.value.find((c) => c.id === second)
    if (firstCard.face === secondCard.face) {
      matchedPairs.value.push(first, second)
      firstCard.matched = true
      secondCard.matched = true
      flippedCards.value = []
    } else {
      setTimeout(() => {
        firstCard.flipped = false
        secondCard.flipped = false
        flippedCards.value = []
      }, 1000)
    }
  }

  const saveGame = async () => {
    const game = {
      type: 'S',
      status: 'E',
      player1_moves: moves.value,
      began_at: beganAt.value,
      ended_at: endedAt.value,
      total_time: Math.ceil((endedAt.value - beganAt.value) / 1000),
      player1_id: authStore.currentUser ? authStore.currentUser.id : undefined,
    }
    await apiStore.postGame(game)
  }

  watch(isGameComplete, (value) => {
    if (value) {
      endedAt.value = new Date()
    }
  })

  return {
    difficulties,
    difficulty,
    cards,
    moves,
    isGameComplete,
    setBoard,
    flipCard,
    checkForMatch,
    saveGame,
    selectedTheme,
  }
})
