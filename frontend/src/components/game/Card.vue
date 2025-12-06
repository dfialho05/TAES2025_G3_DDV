<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useDeckStore } from '@/stores/deck'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  card: { type: Object, default: null },
  faceDown: { type: Boolean, default: false },
  interactable: { type: Boolean, default: false },
  deck: { type: String, default: null }, // Opcional: forçar um deck específico
})

const deckStore = useDeckStore()
const authStore = useAuthStore()
const API_BASE_URL = inject('apiBaseURL') || '/api'

// Estado para controlar fallback
const useLocalAssets = ref(false)
const imageError = ref(false)

// Garantir que os decks são carregados
onMounted(async () => {
  if (deckStore.decks.length === 0) {
    await deckStore.fetchDecks()
  }
})

// Determinar qual deck usar
const activeDeckSlug = computed(() => {
  // Se deck foi especificado como prop, usar esse
  if (props.deck) {
    return props.deck
  }

  // Caso contrário, usar o deck ativo do usuário
  const activeDeck = deckStore.activeDeck
  const slug = activeDeck?.slug || 'default'

  return slug
})

// --- FIX: Resetar o estado de erro quando o deck muda ---
watch(activeDeckSlug, () => {
  useLocalAssets.value = false
  imageError.value = false
})

// Função para gerar URL local (assets)
const getLocalAssetUrl = (filename) => {
  return new URL(`../../assets/cards/default/${filename}`, import.meta.url).href
}

// Função para gerar nome do arquivo da carta
const getCardFilename = () => {
  if (props.faceDown || !props.card) {
    return 'semFace.png'
  }

  // --- FIX: Forçar minúsculas no naipe (ex: 'C' vira 'c') ---
  const naipeCode = props.card.naipe ? props.card.naipe.toLowerCase() : ''

  const rankMap = {
    A: '1',
    J: '11',
    Q: '12',
    K: '13',
  }
  const rankCode = rankMap[props.card.rank] || props.card.rank
  return `${naipeCode}${rankCode}.png`
}

const cardImage = computed(() => {
  const filename = getCardFilename()

  // Se devemos usar assets locais (apenas se já falhou anteriormente neste contexto)
  if (useLocalAssets.value) {
    return getLocalAssetUrl(filename)
  }

  // Caso contrário, tenta a API
  return `${API_BASE_URL}/decks/${activeDeckSlug.value}/image/${filename}`
})

// Função para lidar com erro de imagem
const handleImageError = () => {
  // Apenas ativa o fallback se ainda não estiver ativo
  if (!useLocalAssets.value) {
    // console.warn(`[Card] Erro API. Ativando fallback local.`)
    useLocalAssets.value = true
    imageError.value = true
  }
}

// Função para reset do estado quando imagem carrega com sucesso
const handleImageLoad = () => {
  if (imageError.value && !useLocalAssets.value) {
    imageError.value = false
  }
}
</script>

<template>
  <div class="card-wrapper" :class="{ interactable: interactable }">
    <img
      :src="cardImage"
      alt="Carta"
      draggable="false"
      @error="handleImageError"
      @load="handleImageLoad"
    />
  </div>
</template>

<style scoped>
.card-wrapper {
  width: 70px;
  height: 100px;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.2s;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.interactable {
  cursor: pointer;
}
.interactable:hover {
  transform: translateY(-15px);
  z-index: 10;
}
</style>
