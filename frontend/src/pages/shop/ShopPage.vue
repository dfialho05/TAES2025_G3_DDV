<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <h1 class="text-3xl font-bold">Skin Shop</h1>

      <div class="bg-secondary/50 px-6 py-3 rounded-xl flex items-center gap-2 border">
        <span class="text-muted-foreground font-medium">Balance:</span>
        <span class="text-2xl font-bold text-yellow-600">{{ userBalance }} coins</span>
      </div>
    </div>

    <div v-if="deckStore.isLoading" class="text-center py-10 text-muted-foreground">
      Loading catalog...
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="deck in deckStore.decks"
        :key="deck.id"
        :class="{ 'border-green-500 ring-1 ring-green-500 bg-green-50/10': isActive(deck.id) }"
        class="transition-all hover:shadow-md"
      >
        <CardHeader class="pb-2">
          <div class="flex justify-between items-start">
            <CardTitle class="text-xl">{{ deck.name }}</CardTitle>

            <span
              v-if="isActive(deck.id)"
              class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full"
            >
              ACTIVE
            </span>
            <span
              v-else-if="isOwned(deck.id)"
              class="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full"
            >
              OWNED
            </span>
          </div>
        </CardHeader>

        <CardContent class="text-center py-4">
          <div class="relative aspect-video w-full overflow-hidden rounded-md mb-4 shadow-sm">
            <img
              :src="getDeckPreview(deck.slug)"
              :alt="deck.name"
              class="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
            />
          </div>

          <p v-if="!isOwned(deck.id)" class="text-lg font-semibold text-muted-foreground">
            {{ deck.price == 0 ? 'Free' : deck.price + ' coins' }}
          </p>
        </CardContent>

        <CardFooter>
          <Button
            @click="handleAction(deck)"
            class="w-full font-bold"
            :variant="getButtonVariant(deck)"
            :disabled="isButtonDisabled(deck)"
          >
            {{ getButtonText(deck) }}
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useDeckStore } from '@/stores/deck'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner' // Usar o toast bonito como no Perfil

// Importar os componentes UI (Shadcn/Tailwind)
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const deckStore = useDeckStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Não precisamos de lógica manual de "init".
  // O authStore é reativo. Se o user existir, aparece.
  await deckStore.fetchDecks()
})

const userBalance = computed(() => authStore.currentUser?.coins_balance ?? 0)

// --- HELPERS LÓGICOS ---

const isOwned = (deckId) => {
  const myDecks = authStore.currentUser?.custom?.decks || []
  return myDecks.includes(deckId) || deckId === 1
}

const isActive = (deckId) => {
  const current = authStore.currentUser?.custom?.active_deck_id || 1
  return current === deckId
}

const canAfford = (price) => userBalance.value >= price

// --- LÓGICA VISUAL (Botões) ---

const isButtonDisabled = (deck) => {
  if (isActive(deck.id)) return true
  if (!isOwned(deck.id) && !canAfford(deck.price)) return true
  return false
}

const getButtonText = (deck) => {
  if (isActive(deck.id)) return 'Equipped'
  if (isOwned(deck.id)) return 'Equip'
  if (!canAfford(deck.price)) return 'Not Enough Coins'
  return 'Buy'
}

// Define a cor do botão baseado no estado
const getButtonVariant = (deck) => {
  if (isActive(deck.id)) return 'secondary' // Cinzento/Desativado
  if (isOwned(deck.id)) return 'default' // Preto/Padrão (Para equipar)
  if (!canAfford(deck.price)) return 'destructive' // Vermelho/Aviso
  return 'default' // Azul/Normal (depende do teu tema)
}

// --- AÇÕES ---

const handleAction = async (deck) => {
  // 1. EQUIPAR
  if (isOwned(deck.id)) {
    const result = await deckStore.equipDeck(deck.id)
    if (result.success) {
      toast.success(`Deck "${deck.name}" equipped!`)
    } else {
      toast.error(result.message)
    }
    return
  }

  // 2. COMPRAR
  if (!confirm(`Buy "${deck.name}" for ${deck.price} coins?`)) return

  const result = await deckStore.buyDeck(deck.id)

  if (result.success) {
    toast.success('Purchase successful! Deck added to collection.')
  } else {
    toast.error(result.message)
  }
}

// Helper de Imagem (Nova API)
const getDeckPreview = (slug) => {
  return deckStore.getDeckPreviewUrl(slug)
}
</script>
