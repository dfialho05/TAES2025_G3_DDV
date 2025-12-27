<script setup>
import { ref, onMounted, computed } from 'vue' // Adicionado computed
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const apiStore = useAPIStore()

// Core state
const users = ref([])
const loading = ref(false)
const searchQuery = ref('') // texto de pesquisa
const sortOption = ref('') // '' | 'alpha_asc' | 'alpha_desc'
let searchTimer = null

/*
  Server-side pagination:
  - currentPage: página atual
  - perPage: itens por página enviados à API
  - users: contém apenas os items da página atual (retorno da API)
  - usersMeta: metadados de paginação retornados pela API (current_page, last_page, total, per_page)
*/
const currentPage = ref(1)
const perPage = ref(20)

// users já está definido acima; users.value conterá apenas os itens da página atual
const usersMeta = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: perPage.value,
})

// Retorna os utilizadores da página atual (pois a API já fornece apenas a página)
const paginatedUsers = computed(() => users.value)

// Total de páginas com fallback
const totalPages = computed(() => usersMeta.value.last_page || 1)

// Muda de página e pede dados ao servidor (respeita pesquisa atual)
const changePage = async (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  await fetchUsersPage(newPage)
}

const newUser = ref({
  name: '',
  email: '',
  password: '',
  type: 'P',
})

/**
 * Actual fetch implementation (no debounce). Returns the normalized response.
 */
const fetchUsersPageImmediate = async (page = 1) => {
  loading.value = true
  try {
    // Forward search query and rely on backend filtering if available.
    const res = await apiStore.getAllUsers(page, perPage.value, {
      q: searchQuery.value || undefined,
      sort: sortOption.value || undefined,
    })
    const payload = res.data ?? {}
    // If backend returns { data, meta }
    if (payload && (payload.data || payload.meta)) {
      users.value = payload.data || []
      usersMeta.value = payload.meta || {
        current_page: page,
        last_page: 1,
        total: Array.isArray(users.value) ? users.value.length : 0,
        per_page: perPage.value,
      }
    } else {
      // fallback: direct array
      users.value = Array.isArray(payload) ? payload : []
      usersMeta.value = {
        current_page: page,
        last_page: 1,
        total: users.value.length,
        per_page: perPage.value,
      }
    }
    // If backend didn't apply search (defensive), apply simple client-side filter
    if (searchQuery.value && users.value.length > 0) {
      const qLower = String(searchQuery.value).toLowerCase()
      const hasMatch = users.value.some((u) =>
        ((u.name || '') + ' ' + (u.nickname || '') + ' ' + (u.email || ''))
          .toLowerCase()
          .includes(qLower),
      )
      if (!hasMatch) {
        users.value = users.value.filter((u) =>
          ((u.name || '') + ' ' + (u.nickname || '') + ' ' + (u.email || ''))
            .toLowerCase()
            .includes(qLower),
        )
        usersMeta.value.total = users.value.length
      }
    }
    // Client-side alphabetical sort fallback
    if (sortOption.value === 'alpha_asc' || sortOption.value === 'alpha_desc') {
      users.value.sort((a, b) => {
        const an = (a.name || '').toString().toLowerCase()
        const bn = (b.name || '').toString().toLowerCase()
        if (an < bn) return -1
        if (an > bn) return 1
        return 0
      })
      if (sortOption.value === 'alpha_desc') {
        users.value.reverse()
      }
    }
  } catch (err) {
    console.error('Erro ao carregar usuários', err)
    users.value = []
    usersMeta.value = { current_page: 1, last_page: 1, total: 0, per_page: perPage.value }
    throw err
  } finally {
    loading.value = false
  }
}

/**
 * Debounced fetch wrapper. Returns a Promise that resolves after the immediate fetch completes.
 * Useful so callers can `await fetchUsersPage(...)` safely.
 */
const fetchUsersPage = (page = 1, debounceMs = 300) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  return new Promise((resolve, reject) => {
    searchTimer = setTimeout(async () => {
      try {
        await fetchUsersPageImmediate(page)
        resolve()
      } catch (e) {
        reject(e)
      } finally {
        searchTimer = null
      }
    }, debounceMs)
  })
}

const handleToggleBlock = async (user) => {
  try {
    await apiStore.toggleBlockUser(user.id)
    // Reload current page from server
    await fetchUsersPage(currentPage.value, 0) // immediate reload
  } catch (err) {
    console.error('Erro ao alterar estado do usuário', err)
    toast.error('Erro ao bloquear/desbloquear usuário.')
  }
}

const handleDeleteUser = async (user) => {
  // Use the globalThis.confirm for lint/SSR safety
  if (!globalThis.confirm(`Tens a certeza que queres remover o utilizador ${user.name}?`)) return
  try {
    await apiStore.deleteUser(user.id)
    toast.success('Usuário removido com sucesso!')
    // Recarregar a página atual
    await fetchUsersPage(currentPage.value, 0)
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
    // Recarregar a página atual para refletir a alteração
    await fetchUsersPage(currentPage.value, 0)
  } catch (err) {
    console.error('Erro ao criar usuário', err)
  }
}

onMounted(() => fetchUsersPage(1))
</script>

<template>
  <div class="p-6 space-y-10">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>

    <section>
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Utilizadores</h2>

      <div v-if="loading" class="text-gray-700 dark:text-gray-300">A carregar...</div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between mb-4 space-x-2">
          <div class="flex items-center space-x-2">
            <input
              v-model="searchQuery"
              @input="() => fetchUsersPage(1)"
              placeholder="Procurar por nome, email ou nickname"
              class="px-2 py-1 border rounded"
            />
            <button
              @click="() => fetchUsersPage(1)"
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Buscar
            </button>
            <button
              @click="
                () => {
                  searchQuery = ''
                  fetchUsersPage(1)
                }
              "
              class="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Limpar
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-600">Ordenar:</label>
            <select
              v-model="sortOption"
              @change="() => fetchUsersPage(1)"
              class="px-2 py-1 border rounded text-sm"
            >
              <option value="">Padrão</option>
              <option value="alpha_asc">A → Z</option>
              <option value="alpha_desc">Z → A</option>
            </select>
          </div>
        </div>
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
              <tr
                v-for="u in paginatedUsers"
                :key="u.id"
                class="border-t hover:bg-gray-50 dark:hover:bg-gray-900"
              >
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
                  <button
                    @click="handleToggleBlock(u)"
                    class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    {{ u.blocked ? 'Desbloquear' : 'Bloquear' }}
                  </button>
                  <button
                    @click="handleDeleteUser(u)"
                    class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div class="text-sm text-gray-700 dark:text-gray-300">
            A mostrar <span class="font-medium">{{ paginatedUsers.length }}</span> de
            <span class="font-medium">{{ usersMeta.total }}</span> resultados
          </div>
          <div class="flex space-x-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Anterior
            </button>
            <div
              class="flex items-center px-4 text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
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
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Criar novo utilizador
      </h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="newUser.name" placeholder="Nome" class="px-2 py-1 border rounded" />
        <input v-model="newUser.email" placeholder="Email" class="px-2 py-1 border rounded" />
        <input
          v-model="newUser.password"
          type="password"
          placeholder="Password"
          class="px-2 py-1 border rounded"
        />
        <select v-model="newUser.type" class="px-2 py-1 border rounded">
          <option value="P">Player</option>
          <option value="A">Admin</option>
        </select>
        <button
          @click="handleCreateUser"
          class="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Criar
        </button>
      </div>
    </section>
  </div>
</template>
