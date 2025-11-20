<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'

import { useRouter } from 'vue-router'

import { useGameStore } from '@/stores/game'
import { useAPIStore } from '@/stores/api'

const gameStore = useGameStore()
const apiStore = useAPIStore()

const router = useRouter()

const selectedDifficulty = ref('')

const highScores = ref([])

const startGame = () => {
  gameStore.difficulty = selectedDifficulty.value
  router.push({ name: 'singleplayer'})
}

onMounted(async () => {
  const response = await apiStore.getGames()

  highScores.value = response.data.data
		.map(item => ({
			moves: item.player1_moves,
      time: item.total_time,
      username: item.player1?.name
    }))
    .sort((a, b) => a.time - b.time == 0 ? a.moves - b.moves : a.time - b.time)
    .slice(0, 3)
})
</script>

<template>
    <div class="flex flex-row justify-center items-stretch gap-5 mt-10">
        <Card class="w-full max-w-md">
            <CardHeader>
                <CardTitle class="text-3xl font-bold text-center">
                    Single Player
                </CardTitle>
                <CardDescription class="text-center">
                    Test your memory by finding matching pairs!
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <div class="space-y-2">
                    <label class="text-sm font-medium">Choose Difficulty</label>
                    <div class="grid grid-cols-3 gap-2">
                      <Button v-for="level in gameStore.difficulties" :key="level.value" size="sm"
                           :variant="selectedDifficulty === level.value ? 'default' : 'outline'"
                            class="flex flex-col py-3 h-16"
                            @click="selectedDifficulty = level.value">
                            <span class="font-semibold">{{ level.label }} </span>
                            <span class="text-xs opacity-70">{{ level.description}}</span>
                      </Button>
                    </div>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">High Scores (local)</label>
                  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="max-h-64 overflow-y-auto">
                      <div v-if="highScores.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                        No high scores yet. Be the first!
                      </div>
                      <div v-else class="divide-y">
                        <div v-for="(score, index) in highScores" :key="index"
                          class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                              :class="{
                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': index === 0,
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': index === 1,
                                'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300': index === 2,
                                'bg-muted text-muted-foreground': index > 2
                              }">
                                {{ index + 1 }}
                            </div>
                            <div>
                              <div class="font-medium text-sm">{{ score.moves }} Moves -- {{ score.username }}</div>
                              <div class="text-xs text-muted-foreground">{{ score.time }} /s</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-center">
                    <Button @click="startGame" size="lg" variant="secondary" class="hover:bg-purple-500 hover:text-slate-200">
                        Start Game
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card class="w-full max-w-md">
            <CardHeader>
                <CardTitle class="text-3xl font-bold text-center">
                    MultiPlayer
                </CardTitle>
                <CardDescription class="text-center">
                    Comming Soon!!
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">

            </CardContent>
        </Card>
    </div>
</template>
