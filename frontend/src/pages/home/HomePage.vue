<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useRouter } from 'vue-router'

import { useBiscaStore } from '@/stores/biscaStore'
import { useAPIStore } from '@/stores/api'
import UserAvatar from '@/components/UserAvatar.vue'  


const gameStore = useBiscaStore()
const apiStore = useAPIStore()

const router = useRouter()

const selectedDifficulty = ref('')

const startGameSingleplayer = (tipo) => {
  router.push({
    name: 'singleplayer',
    query: { mode: tipo },
  })
}

const goToLobby = () => {
  router.push({
    name: 'Lobby',
  })
}
</script>

<template>
  <div class="flex flex-col md:flex-row justify-center items-stretch gap-5 mt-10">
    <Card class="w-full md:max-w-md flex flex-col">
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center"> Single Player </CardTitle>
        <CardDescription class="text-center">
          Joga a bisca contra um bot treinado!
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6 flex-1 flex flex-col">
        <div class="space-y-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              v-for="level in gameStore.difficulties"
              :key="level.value"
              size="sm"
              :variant="selectedDifficulty === level.value ? 'default' : 'outline'"
              class="flex flex-col py-3 h-16 transition-all hover:scale-105"
              @click="selectedDifficulty = level.value"
            >
              <span class="font-semibold">{{ level.label }} </span>
              <span class="text-xs opacity-70">{{ level.description }}</span>
            </Button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <Button
            @click="startGameSingleplayer(3)"
            variant="outline"
            class="h-auto py-4 flex flex-col gap-1 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all group"
          >
            <span
              class="text-lg font-bold group-hover:text-green-600 dark:group-hover:text-green-400"
              >Bisca de 3</span
            >
            <span class="text-xs text-muted-foreground font-normal">Modo Clássico</span>
          </Button>

          <Button
            @click="startGameSingleplayer(9)"
            variant="outline"
            class="h-auto py-4 flex flex-col gap-1 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group"
          >
            <span
              class="text-lg font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400"
              >Bisca de 9</span
            >
            <span class="text-xs text-muted-foreground font-normal">Mão Cheia</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card
      class="w-full max-w-md opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
    >
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center"> MultiPlayer </CardTitle>
        <CardDescription class="text-center"></CardDescription>
      </CardHeader>
      <CardContent class="flex items-center justify-center h-64">
        <Button
          @click="goToLobby"
          variant="outline"
          class="h-auto py-4 flex flex-col gap-1 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group"
        >
          <span
            class="text-lg font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400"
            >Lobby</span
          >
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
