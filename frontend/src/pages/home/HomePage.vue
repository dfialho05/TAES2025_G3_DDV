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

import { useBiscaStore } from '@/stores/biscaStore'
import { useAPIStore } from '@/stores/api'

const gameStore = useBiscaStore()
const apiStore = useAPIStore()

const router = useRouter()

const selectedDifficulty = ref('')

const highScores = ref([])

const startGame = (tipo) => {
gameStore.difficulty = selectedDifficulty.value
 router.push({
    name: 'singleplayer',
    query: { mode: tipo }
  })
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
    <div class="flex flex-col md:flex-row justify-center items-stretch gap-5 mt-10">

        <Card class="w-full md:max-w-md flex flex-col">
            <CardHeader>
                <CardTitle class="text-3xl font-bold text-center">
                    Single Player
                </CardTitle>
                <CardDescription class="text-center">
                    Joga a bisca contra um bot treinado!
                </CardDescription>
            </CardHeader>

            <CardContent class="space-y-6 flex-1 flex flex-col">
                <div class="space-y-2">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button v-for="level in gameStore.difficulties" :key="level.value" size="sm"
                            :variant="selectedDifficulty === level.value ? 'default' : 'outline'"
                            class="flex flex-col py-3 h-16 transition-all hover:scale-105"
                            @click="selectedDifficulty = level.value">
                            <span class="font-semibold">{{ level.label }} </span>
                            <span class="text-xs opacity-70">{{ level.description}}</span>
                        </Button>
                    </div>
                </div>

                <div class="space-y-2 flex-1">
                    <label class="text-sm font-medium">High Scores (local)</label>
                    <div class="rounded-lg border bg-card text-card-foreground shadow-sm h-48">
                        <div class="max-h-full overflow-y-auto custom-scrollbar">
                            <div v-if="highScores.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                                No high scores yet. Be the first!
                            </div>
                            <div v-else class="divide-y">
                                <div v-for="(score, index) in highScores" :key="index"
                                    class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                                            :class="{
                                                'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200': index === 0,
                                                'bg-gray-100 text-gray-700 ring-1 ring-gray-200': index === 1,
                                                'bg-orange-100 text-orange-700 ring-1 ring-orange-200': index === 2,
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

                <div class="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        @click="startGame(3)"
                        variant="outline"
                        class="h-auto py-4 flex flex-col gap-1 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all group"
                    >
                        <span class="text-lg font-bold group-hover:text-green-600 dark:group-hover:text-green-400">Bisca de 3</span>
                        <span class="text-xs text-muted-foreground font-normal">Modo Clássico</span>
                    </Button>

                    <Button
                        @click="startGame(9)"
                        variant="outline"
                        class="h-auto py-4 flex flex-col gap-1 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group"
                    >
                        <span class="text-lg font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400">Bisca de 9</span>
                        <span class="text-xs text-muted-foreground font-normal">Mão Cheia</span>
                    </Button>
                </div>

            </CardContent>
        </Card>

        <Card class="w-full max-w-md opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <CardHeader>
                <CardTitle class="text-3xl font-bold text-center">
                    MultiPlayer
                </CardTitle>
                <CardDescription class="text-center">
                    Em breve...
                </CardDescription>
            </CardHeader>
            <CardContent class="flex items-center justify-center h-64">
                 <span class="text-4xl">🚧</span>
            </CardContent>
        </Card>
    </div>
</template>
