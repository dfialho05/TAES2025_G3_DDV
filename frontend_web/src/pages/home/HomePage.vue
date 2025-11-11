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
                            @click="selectedDifficulty = level.value"
                            :variant="selectedDifficulty === level.value ? 'default' : 'outline'"
                            class="flex flex-col py-3 h-16">
                            <span class="font-semibold">{{ level.label }}</span>
                            <span class="text-xs opacity-70">{{ level.description }}</span>
                        </Button>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-medium">High Scores (local)</label>
                    <!-- TODO: Add High Scores functionality -->
                </div>

                <div class="flex justify-center">
                    <Button size="lg" variant="secondary" class="hover:bg-purple-500 hover:text-slate-200"
                        @click="startGame">
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

<script setup>
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
import { ref } from 'vue'

const router = useRouter()
const gameStore = useGameStore()

const selectedDifficulty = ref('medium')

const startGame = () => {
  gameStore.difficulty = selectedDifficulty.value
  router.push({ name: 'singleplayer'} )
}
</script>
