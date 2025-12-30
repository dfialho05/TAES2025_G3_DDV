<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Função para iniciar jogos que não precisam de login (practice)
const startPracticeGame = (cards, wins) => {
  router.push({
    name: 'singleplayer',
    query: {
      mode: cards,
      wins: wins,
      practice: 'true',
    },
  })
}

// Função para iniciar jogos que precisam de login
const startGame = (cards, wins) => {

  router.push({
    name: 'singleplayer',
    query: {
      mode: cards,
      wins: wins,
    },
  })
}

const goToLobby = () => {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'login' })
    return
  }

  router.push({ name: 'Lobby' })
}
</script>

<template>
  <div class="flex flex-col md:flex-row justify-center items-stretch gap-6 mt-10 px-4 mb-10">
    <!-- ================= SINGLE PLAYER ================= -->
    <Card
      class="w-full md:max-w-lg flex flex-col transition-all hover:shadow-md border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-800"
    >
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center flex items-center justify-center gap-2">
          🤖 Single Player
        </CardTitle>
        <CardDescription class="text-center">
          Escolhe o teu modo de jogo contra o Bot
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6 flex-1 flex flex-col">
        <!-- PARTIDA COMPLETA -->
        <div class="space-y-2">
          <h3
            class="text-sm font-bold text-green-600 uppercase tracking-wide border-b border-green-100 pb-1 flex items-center justify-between"
          >
            <span>PARTIDA COMPLETA (Race to 4)</span>
          </h3>

          <div class="grid grid-cols-2 gap-3">
            <Button
              :disabled="authStore.isAdmin"
              @click="startGame(3, 4)"
              variant="outline"
              class="h-auto py-3 border-2"
              :class="authStore.isAdmin && 'opacity-50 cursor-not-allowed'"
            >
              <div class="flex flex-col items-center">
                <span class="text-lg font-bold">Bisca de 3</span>
                <span class="text-[10px] text-muted-foreground">Melhor de 4</span>
              </div>
            </Button>

            <Button
              :disabled="authStore.isAdmin"
              @click="startGame(9, 4)"
              variant="outline"
              class="h-auto py-3 border-2"
              :class="authStore.isAdmin && 'opacity-50 cursor-not-allowed'"
            >
              <div class="flex flex-col items-center">
                <span class="text-lg font-bold">Bisca de 9</span>
                <span class="text-[10px] text-muted-foreground">Melhor de 4</span>
              </div>
            </Button>
          </div>
        </div>

        <!-- PARTIDA RÁPIDA -->
        <div class="space-y-2">
          <h3
            class="text-sm font-bold text-blue-600 uppercase tracking-wide border-b border-blue-100 pb-1 flex items-center justify-between"
          >
            <span>Partida Rápida (1 jogo)</span>

          </h3>

          <div class="grid grid-cols-2 gap-3">
            <Button
              :disabled="authStore.isAdmin"
              @click="startGame(3, 1)"
              variant="outline"
              class="h-auto py-3 border-2"
              :class="authStore.isAdmin && 'opacity-50 cursor-not-allowed'"
            >
              <div class="flex flex-col items-center">
                <span class="text-lg font-bold">Bisca 3</span>
                <span class="text-[10px] text-muted-foreground">Morte Súbita</span>
              </div>
            </Button>

            <Button
              :disabled="authStore.isAdmin"
              @click="startGame(9, 1)"
              variant="outline"
              class="h-auto py-3 border-2"
              :class="authStore.isAdmin && 'opacity-50 cursor-not-allowed'"
            >
              <div class="flex flex-col items-center">
                <span class="text-lg font-bold">Bisca 9</span>
                <span class="text-[10px] text-muted-foreground">Morte Súbita</span>
              </div>
            </Button>
          </div>
        </div>


        <!-- AVISO ADMIN -->
        <p v-if="authStore.isAdmin" class="text-sm text-center text-red-600 font-semibold mt-4">
          Utilizadores administradores não podem jogar.
        </p>
      </CardContent>
    </Card>

    <!-- ================= MULTIPLAYER ================= -->
    <Card
      class="w-full md:max-w-md flex flex-col transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800"
    >
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center flex items-center justify-center gap-2">
          MultiPlayer
        </CardTitle>
        <CardDescription class="text-center flex flex-col items-center gap-1">
          <span>Joga contra pessoas reais</span>
          <span class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            LOGIN OBRIGATÓRIO
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col items-center justify-center flex-1 min-h-[200px] gap-3">
        <Button
          :disabled="authStore.isAdmin"
          @click="goToLobby"
          variant="outline"
          class="w-full h-auto py-8 flex flex-col gap-2 border-2"
          :class="authStore.isAdmin && 'opacity-50 cursor-not-allowed'"
        >
          <span class="text-3xl"></span>
          <span class="text-2xl font-bold">Entrar no Lobby</span>
          <span class="text-sm text-muted-foreground">Encontrar ou Criar Salas</span>
        </Button>

        <!-- AVISO ADMIN -->
        <p v-if="authStore.isAdmin" class="text-sm text-red-600 font-semibold text-center">
          Administradores não podem aceder ao modo Multiplayer.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
