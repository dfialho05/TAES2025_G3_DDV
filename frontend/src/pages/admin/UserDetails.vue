<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAPIStore } from '@/stores/api'

const route = useRoute()
const apiStore = useAPIStore()

const transactions = ref([])
const user = ref(null)
const loading = ref(true)

// Server-side pagination settings
const perPage = 50
const pagination = ref({
  current_page: 1,
  per_page: perPage,
  total: 0,
  last_page: 1,
})

const transactionTypes = {
  1: 'Bónus',
  2: 'Compra',
  3: 'Prémio Jogo',
  4: 'Taxa',
}

/**
 * Fetch user details and the first page of transactions.
 * Accepts optional page param to load a specific page immediately.
 */
const fetchUserDetails = async (page = 1) => {
  const userId = route.params.id
  loading.value = true
  try {
    const resUser = await apiStore.getUserById(userId)
    user.value = resUser.data
    await fetchTransactions(page)
  } catch (err) {
    console.error('Erro ao carregar detalhes', err)
    user.value = null
    transactions.value = []
    pagination.value = { current_page: 1, per_page: perPage, total: 0, last_page: 1 }
  } finally {
    loading.value = false
  }
}

/**
 * Load a page of transactions from the server.
 */
const fetchTransactions = async (page = 1) => {
  const userId = route.params.id
  loading.value = true
  try {
    const resTrans = await apiStore.getUserTransactions(userId, page, perPage)
    const payload = resTrans.data ?? {}
    transactions.value = payload.data ?? []
    pagination.value = payload.meta ?? {
      current_page: page,
      per_page: perPage,
      total: transactions.value.length,
      last_page: 1,
    }
  } catch (err) {
    console.error('Erro ao carregar transações', err)
    transactions.value = []
    pagination.value = { current_page: 1, per_page: perPage, total: 0, last_page: 1 }
  } finally {
    loading.value = false
  }
}

/**
 * Change to a given page (server-side) and fetch data.
 */
const goToPage = async (page) => {
  if (!page || page < 1 || page > pagination.value.last_page) return
  pagination.value.current_page = page
  await fetchTransactions(page)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => fetchUserDetails(1))
</script>

<template>
  <div
    class="p-6 max-w-full mx-auto min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"
  >
    <button
      @click="$router.back()"
      class="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
    >
      <span class="text-lg">←</span> Voltar para a Lista
    </button>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
      <p class="italic text-sm">A carregar registos financeiros...</p>
    </div>

    <div v-else-if="user" class="space-y-6">
      <div
        class="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6"
      >
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Transações de {{ user.name }}
            <button
              type="button"
              @click="$router.push(`/profile/${user.id}`)"
              class="ml-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Ver Perfil
            </button>
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {{ user.email }} •
            <span
              class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border dark:border-gray-700 text-gray-600 dark:text-gray-300"
              >ID: {{ user.id }}</span
            >
          </p>
        </div>
        <div class="text-right text-sm text-gray-400 dark:text-gray-500">
          Total: {{ transactions.length }} registos
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <table class="w-full text-left table-auto border-separate border-spacing-0">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50">
              <th
                class="p-4 font-bold text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider"
              >
                Data / Hora
              </th>
              <th
                class="p-4 font-bold text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider"
              >
                Origem
              </th>
              <th
                class="p-4 font-bold text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider text-center"
              >
                Tipo
              </th>
              <th
                class="p-4 font-bold text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider text-right"
              >
                Valor
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="t in transactions"
              :key="t.id"
              class="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
            >
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {{ formatDate(t.transaction_datetime) }}
              </td>
              <td class="p-4">
                <div class="flex gap-2 items-center">
                  <span
                    v-if="t.match_id"
                    class="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800"
                    >Match #{{ t.match_id }}</span
                  >
                  <span
                    v-if="t.game_id"
                    class="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold border border-purple-100 dark:border-purple-800"
                    >Game #{{ t.game_id }}</span
                  >
                  <span
                    v-if="!t.match_id && !t.game_id"
                    class="text-gray-300 dark:text-gray-600 text-xs italic"
                    >Sem origem direta</span
                  >
                </div>
              </td>
              <td class="p-4 text-center">
                <span
                  class="inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                >
                  {{ transactionTypes[t.coin_transaction_type_id] || 'Outro' }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <span
                  class="text-base font-black tabular-nums"
                  :class="
                    t.coins >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  "
                >
                  {{ t.coins > 0 ? '+' : '' }}{{ t.coins }}
                  <span class="ml-1 text-sm">coins</span>
                </span>
              </td>
            </tr>

            <tr v-if="transactions.length === 0">
              <td colspan="4" class="p-20 text-center">
                <div class="text-gray-300 dark:text-gray-700 text-5xl mb-4 text-center"></div>
                <p class="text-gray-400 dark:text-gray-500 font-medium text-lg text-center">
                  Sem histórico de moedas.
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="pagination.last_page > 1"
          class="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Página {{ pagination.current_page }} de {{ pagination.last_page }}
          </span>
          <div class="flex gap-2">
            <button
              @click="goToPage(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              class="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <button
              @click="goToPage(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.last_page"
              class="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
