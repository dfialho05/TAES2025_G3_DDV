<script setup>
  import GameBoard from '@/components/game/GameBoard.vue';
  import { useGameStore } from '@/stores/game'
  import { onMounted, watch } from 'vue'
  import { toast } from 'vue-sonner'
  const gameStore = useGameStore()


const handleFlipCard = (card) => {
  gameStore.flipCard(card)
}

watch(
  () => gameStore.isGameComplete,
  (isComplete) => {
    if (isComplete) {
      toast.success(`Game Completed in ${gameStore.moves} moves`)
      gameStore.saveGame()
    }
})

onMounted(() => {
  gameStore.setBoard()
})
</script>

<template>
    <div class="space-y-6">
        <GameBoard :cards="gameStore.cards"
          @flipCard="handleFlipCard"></GameBoard>
    </div>
</template>
