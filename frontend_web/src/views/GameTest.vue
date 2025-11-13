<template>
    <div class="min-h-screen bg-green-700 p-8">
        <h1 class="text-white text-2xl mb-8">Game Test Page</h1>

        <!-- Simple test to verify components work -->
        <div class="flex flex-col items-center gap-8">

            <!-- Test Card Component -->
            <div class="bg-white/10 p-4 rounded-lg">
                <h2 class="text-white mb-4">Test Card Component:</h2>
                <div class="flex gap-4">
                    <Card suit="c" :value="7" :hidden="false" />
                    <Card suit="e" :value="1" :hidden="false" />
                    <Card suit="o" :value="12" :hidden="true" />
                </div>
            </div>

            <!-- Test Deck Component -->
            <div class="bg-white/10 p-4 rounded-lg">
                <h2 class="text-white mb-4">Test Deck Component:</h2>
                <Deck
                    :stack-size="22"
                    :trump-card="{ suit: 'c', value: 7 }"
                    :show-trump="true"
                />
            </div>

            <!-- Simple Layout Test -->
            <div class="bg-white/10 p-4 rounded-lg w-full max-w-4xl">
                <h2 class="text-white mb-4">Layout Test:</h2>
                <div class="flex items-center justify-start pl-8">
                    <div class="flex items-center gap-20 w-full">
                        <!-- Deck area -->
                        <div class="flex flex-col items-center">
                            <div class="w-20 h-28 bg-blue-600 rounded-lg mb-2"></div>
                            <span class="text-white text-xs">Deck</span>
                        </div>

                        <!-- Play area -->
                        <div class="flex flex-col items-center gap-6 flex-1 max-w-md">
                            <h3 class="text-white">Mesa</h3>
                            <div class="flex gap-12">
                                <div class="w-28 h-36 bg-white/20 rounded-lg"></div>
                                <div class="w-28 h-36 bg-white/20 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../components/Card.vue'
import Deck from '../components/Deck.vue'

// Simple test data
const testMessage = ref('Components loading test')
</script>

<style scoped>
/* Basic styles */
</style>
