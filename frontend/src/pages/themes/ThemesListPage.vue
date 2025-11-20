<template>
    <div class="max-w-6xl mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Board Themes</h1>
            <button v-if="authStore.isLoggedIn" @click="$router.push('/themes/create')"
                class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                + Create Theme
            </button>
        </div>
        <div v-if="themes.length === 0" class="text-center py-12">
            <p class="text-gray-600">No themes available yet.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="theme in themes" :key="theme.id"
                class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
                :class="{ 'border-2 border-yellow-400': theme.is_global }">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg">{{ theme.name }}</h3>
                    <div class="flex gap-2">
                        <span class="text-xs px-2 py-1 rounded" :class="theme.visibility === 'PU'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            ">
                            {{ theme.visibility === 'PU' ? 'Public' : 'Private' }}
                        </span>
                    </div>
                </div>

                <p class="text-sm text-gray-600 mb-3">{{ theme.description || 'No description' }}</p>

                <div v-if="theme.cards && theme.cards.length > 0" class="grid grid-cols-4 gap-1 mb-3">
                    <div v-for="card in theme.cards.slice(0, 4)" :key="card"
                        class="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img :src="`${serverBaseURL}${card.face_image_url}`" class="w-full h-full object-cover" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <button @click="selectTheme(theme)"
                        class="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition">
                        Use Theme
                    </button>
                    <div class="flex gap-2">
                        <button @click="editTheme(theme.id)"
                            class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                            Edit
                        </button>
                        <button @click="deleteTheme(theme.id)"
                            class="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const authStore = useAuthStore()
const apiStore = useAPIStore()
const gameStore = useGameStore()

const serverBaseURL = inject("serverBaseURL")

const themes = ref([])

const loadThemes = async () => {
    try {
        const response = await apiStore.getBoardThemes()
        themes.value = response.data.data
    } catch (error) {
        console.error('Failed to load themes:', error)
    }
}



const selectTheme = (theme) => {
    gameStore.selectedTheme = theme
    router.push('/games/singleplayer')
}

const editTheme = (id) => {
    router.push(`/themes/edit/${id}`)
}

const deleteTheme = async (id) => {
    if (!confirm('Are you sure you want to delete this theme?')) return

    try {
        await apiStore.deleteBoardTheme(id)
        await loadThemes()
    } catch (error) {
        console.error('Failed to delete theme:', error)
    }
}

onMounted(() => {
    loadThemes()
})
</script>

<style scoped></style>
