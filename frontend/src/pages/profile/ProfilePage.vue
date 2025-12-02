<template>
  <div class="max-w-6xl mx-auto p-6">
    <div v-if="loadingUser" class="text-center py-12">
      <div
        class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
      ></div>
      <p class="text-lg text-gray-500">A carregar perfil...</p>
    </div>

    <div v-else-if="displayedUser" class="space-y-8">
      <div class="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
        <div class="flex-shrink-0 relative group">
          <Avatar class="w-32 h-32 border-4 border-white shadow-lg">
            <AvatarImage
              v-if="displayedUser.photo_avatar_filename"
              :src="`${serverBaseURL}/storage/photos_avatars/${displayedUser.photo_avatar_filename}`"
              :alt="displayedUser.name"
              class="object-cover"
            />
            <AvatarFallback class="text-4xl bg-slate-200 text-slate-600">
              {{ displayedUser.name?.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
        </div>

        <div class="flex-1 text-center md:text-left space-y-2 pt-2">
          <h1 class="text-3xl font-bold tracking-tight">{{ displayedUser.name }}</h1>
          <p class="text-gray-500 font-mono">{{ displayedUser.email }}</p>

          <div v-if="isOwner" class="pt-2">
            <div v-if="!files" class="inline-block">
              <Button @click="open" variant="outline" size="sm" class="bg-white">
                Alterar Foto
              </Button>
            </div>

            <div v-else class="flex flex-wrap gap-2 justify-center md:justify-start">
              <Button @click="uploadPhoto" size="sm">Guardar</Button>
              <Button
                @click="reset"
                variant="ghost"
                size="sm"
                class="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div :class="isOwner ? 'md:col-span-1' : 'md:col-span-2 max-w-3xl mx-auto w-full'">
          <div class="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div class="p-6 border-b bg-slate-50/50">
              <h3 class="font-semibold text-lg leading-none tracking-tight">
                Histórico de Partidas
              </h3>
              <p class="text-sm text-muted-foreground mt-1">Jogos recentes</p>
            </div>

            <div class="p-6">
              <div v-if="matchesStore.loading" class="text-center py-8 text-gray-400">
                A atualizar histórico...
              </div>

              <div
                v-else-if="!matchesStore.hasMatches"
                class="text-center py-10 border-2 border-dashed rounded-lg text-gray-400"
              >
                Nenhuma partida registada.
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="match in matchesStore.matches"
                  :key="match.id"
                  class="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div class="flex flex-col">
                    <span
                      class="font-bold text-sm uppercase tracking-wider mb-1"
                      :class="isWinner(match) ? 'text-green-600' : 'text-red-500'"
                    >
                      {{ isWinner(match) ? 'VITÓRIA' : 'DERROTA' }}
                    </span>
                    <span class="text-xs text-gray-500"> vs {{ getOpponentName(match) }} </span>
                  </div>

                  <div class="text-right">
                    <span
                      class="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                    >
                      {{ match.type || 'Jogo' }}
                    </span>
                    <span class="block text-xs text-gray-400 mt-1">
                      {{ formatDate(match.began_at) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isOwner" class="md:col-span-1">
          <div class="bg-card rounded-xl border shadow-sm">
            <div class="p-6 border-b bg-slate-50/50">
              <h3 class="font-semibold text-lg leading-none tracking-tight">Editar Dados</h3>
              <p class="text-sm text-muted-foreground mt-1">
                Atualiza as tuas informações pessoais
              </p>
            </div>

            <div class="p-6 space-y-4">
              <div class="space-y-2">
                <Label for="name">Nome</Label>
                <Input id="name" v-model="formData.name" class="bg-white" />
              </div>

              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="formData.email" type="email" class="bg-white" />
              </div>

              <div class="pt-4 space-y-3">
                <Button @click="saveProfile" class="w-full font-semibold">
                  Guardar Alterações
                </Button>

                <div v-if="authStore.currentUser?.type !== 'A'" class="pt-2">
                  <Button
                    @click="confirmDelete"
                    variant="ghost"
                    class="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Eliminar Conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold text-gray-800">Utilizador não encontrado</h2>
      <Button @click="router.push('/')" variant="link" class="mt-4">Voltar à Home</Button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useMatchesStore } from '@/stores/matches'
import { useFileDialog } from '@vueuse/core'
import { toast } from 'vue-sonner'
import axios from 'axios'

// Componentes UI (ajusta os caminhos se necessário)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const apiStore = useAPIStore()
const matchesStore = useMatchesStore()

const serverBaseURL = inject('serverBaseURL')

// --- Estados ---
const displayedUser = ref(null)
const loadingUser = ref(true)
const formData = ref({ name: '', email: '' })

// --- Computed ---
const isOwner = computed(() => {
  return (
    authStore.currentUser &&
    displayedUser.value &&
    authStore.currentUser.id === displayedUser.value.id
  )
})

// --- Carregamento de Dados ---
watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return

    loadingUser.value = true
    displayedUser.value = null
    matchesStore.matches = [] // Limpa visualmente antes de carregar

    try {
      // 1. Identificar o User
      if (authStore.currentUser && authStore.currentUser.id == newId) {
        displayedUser.value = authStore.currentUser
      } else {
        const response = await axios.get(`/users/${newId}`)
        displayedUser.value = response.data.data || response.data
      }

      // 2. Preencher form se for dono
      if (isOwner.value) {
        formData.value = {
          name: displayedUser.value.name,
          email: displayedUser.value.email,
        }
      }

      // 3. Buscar Jogos (Ordenados pelo Backend)
      // Chama a store que criaste anteriormente
      await matchesStore.fetchMatchesByUser(newId)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Não foi possível carregar o perfil.')
    } finally {
      loadingUser.value = false
    }
  },
  { immediate: true },
)

// --- Helpers Visuais ---
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getOpponentName = (match) => {
  if (!displayedUser.value) return '...'
  const myId = displayedUser.value.id

  // Lógica para encontrar o nome do oponente
  // O backend envia player1_user_id e os objetos player1/player2
  if (match.player1_user_id === myId) {
    return match.player2 ? match.player2.name : 'Desconhecido'
  }
  return match.player1 ? match.player1.name : 'Desconhecido'
}

const isWinner = (match) => {
  if (!match.winner_user_id && !match.winner) return false

  // Verifica pelo ID do vencedor
  // Suporta tanto se o backend enviar objeto 'winner' ou apenas 'winner_user_id'
  const winnerId = match.winner_user_id || match.winner?.id
  return winnerId === displayedUser.value.id
}

// --- Funções de Edição ---
const { files, open, reset } = useFileDialog({ accept: 'image/*', multiple: false })

const uploadPhoto = async () => {
  if (!files.value || !isOwner.value) return
  try {
    const response = await apiStore.uploadProfilePhoto(files.value[0])
    const filename = response.data.filename || response.data.location || response.data

    if (filename) {
      await apiStore.patchUserPhoto(authStore.currentUser.id, filename)
      await authStore.getUser() // Atualiza store global
      displayedUser.value = authStore.currentUser // Atualiza local
      toast.success('Foto atualizada!')
      reset()
    }
  } catch (error) {
    toast.error('Erro no upload.')
  }
}

const saveProfile = async () => {
  if (!isOwner.value) return
  try {
    const userToUpdate = { ...authStore.currentUser, ...formData.value }
    await apiStore.putUser(userToUpdate)
    await authStore.getUser()
    displayedUser.value = authStore.currentUser
    toast.success('Perfil guardado!')
  } catch (error) {
    toast.error('Erro ao guardar.')
  }
}

const confirmDelete = async () => {
  if (!confirm('Tem a certeza que deseja eliminar a conta?')) return
  const pwd = prompt('Confirme a sua password:')
  if (!pwd) return
  try {
    await authStore.deleteAccount(pwd)
    try {
      await authStore.logout()
    } catch (e) {}
    router.push('/')
    toast.success('Conta eliminada.')
  } catch (error) {
    toast.error('Erro ao eliminar conta.')
  }
}
</script>
