<script setup>
import { ref, onMounted, computed } from 'vue' // Adicionado computed
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const apiStore = useAPIStore()

const users = ref([])
const loading = ref(false)

// --- ESTADO DA PAGINAÇÃO ---
const currentPage = ref(1)
const itemsPerPage = 20

// Filtra a lista total para mostrar apenas o "pedaço" da página atual
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return users.value.slice(start, end)
})

// Calcula o número total de páginas
const totalPages = computed(() => {
  return Math.ceil(users.value.length / itemsPerPage) || 1
})

// Função para navegar entre páginas
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
    // Opcional: faz scroll para o topo da tabela ao mudar de página
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
// ---------------------------

const newUser = ref({
  name: '',
  email: '',
  password: '',
  type: 'P',
})

const fetchAllUsers = async () => {
  loading.value = true
  try {
    const res = await apiStore.getAllUsers()
    users.value = res.data.data || res.data || []
    // Reset para a página 1 sempre que os dados forem atualizados
    currentPage.value = 1 
  } catch (err) {
    console.error('Erro ao carregar usuários', err)
    users.value = []
  } finally {
    loading.value = false
  }
}

const handleToggleBlock = async (user) => {
  try {
    await apiStore.toggleBlockUser(user.id)
    await fetchAllUsers()
  } catch (err) {
    console.error('Erro ao alterar estado do usuário', err)
    toast.error('Erro ao bloquear/desbloquear usuário.')
  }
}

const handleDeleteUser = async (user) => {
  if (!confirm(`Tens a certeza que queres remover o utilizador ${user.name}?`)) return
  try {
    await apiStore.deleteUser(user.id)
    toast.success('Usuário removido com sucesso!')
    await fetchAllUsers()
  } catch (err) {
    console.error('Erro ao remover usuário', err)
    toast.error('Não foi possível remover o usuário.')
  }
}

const handleCreateUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    toast.error('Preenche todos os campos obrigatórios!')
    return
  }

  const payload = {
    name: newUser.value.name,
    email: newUser.value.email,
    password: newUser.value.password,
    type: newUser.value.type,
  }

  try {
    await toast.promise(apiStore.postUser(payload), {
      loading: 'A criar usuário...',
      success: () => 'Usuário criado com sucesso!',
      error: (err) => {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido'
        return `[API] ${msg}`
      },
    })
    newUser.value = { name: '', email: '', password: '', type: 'P' }
    await fetchAllUsers()
  } catch (err) {
    console.error('Erro ao criar usuário', err)
  }
}

onMounted(() => fetchAllUsers())
</script>

<template>
  <div class="p-6 space-y-10">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>

    <section>
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Utilizadores</h2>

      <div v-if="loading" class="text-gray-700 dark:text-gray-300">A carregar...</div>

      <div v-else class="space-y-4">
        <div class="overflow-x-auto">
          <table class="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">ID</th>
                <th class="p-2 text-left">Nome</th>
                <th class="p-2 text-left">Email</th>
                <th class="p-2 text-left">Tipo</th>
                <th class="p-2 text-left">Estado</th>
                <th class="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in paginatedUsers" :key="u.id" class="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td class="p-2">{{ u.id }}</td>
                <td class="p-2">
                <router-link 
                :to="{ name: 'user-details', params: { id: u.id } }" 
                class="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                {{ u.name }}
            </router-link>
            </td>
                <td class="p-2">{{ u.email }}</td>
                <td class="p-2">{{ u.type === 'A' ? 'Admin' : 'Player' }}</td>
                <td class="p-2">{{ u.blocked ? 'Bloqueado' : 'Ativo' }}</td>
                <td class="p-2 space-x-2">
                  <button @click="handleToggleBlock(u)" class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                    {{ u.blocked ? 'Desbloquear' : 'Bloquear' }}
                  </button>
                  <button @click="handleDeleteUser(u)" class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                    Remover
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            A mostrar <span class="font-medium">{{ paginatedUsers.length }}</span> de <span class="font-medium">{{ users.length }}</span> resultados
          </div>
          <div class="flex space-x-2">
            <button 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Anterior
            </button>
            <div class="flex items-center px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Página {{ currentPage }} de {{ totalPages }}
            </div>
            <button 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Criar novo utilizador</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="newUser.name" placeholder="Nome" class="px-2 py-1 border rounded" />
        <input v-model="newUser.email" placeholder="Email" class="px-2 py-1 border rounded" />
        <input v-model="newUser.password" type="password" placeholder="Password" class="px-2 py-1 border rounded" />
        <select v-model="newUser.type" class="px-2 py-1 border rounded">
          <option value="P">Player</option>
          <option value="A">Admin</option>
        </select>
        <button @click="handleCreateUser" class="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700">
          Criar
        </button>
      </div>
    </section>
  </div>
</template>