<template>
  <div class="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Painel de administração — vistas rápidas e ações reais
        </p>
      </div>

      <div class="text-right">
        <div class="text-sm text-gray-500 dark:text-gray-400">Logado como</div>
        <div class="font-semibold text-gray-900 dark:text-gray-100">{{ adminName || '—' }}</div>
      </div>
    </div>

    <div>
      <div
        class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        <h2 class="text-xl font-semibold dark:text-white text-gray-700 mb-4">
          Relatórios de Sistema
        </h2>

        <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Receita Total</p>
            <p class="text-3xl font-black text-green-600">
              {{ stats.financial?.purchases_euros?.toFixed(2) ?? '0.00' }}€
            </p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Jogos Totais</p>
            <p class="text-3xl font-black text-blue-600">{{ stats.activity?.games ?? 0 }}</p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Transações</p>
            <p class="text-3xl font-black text-orange-500">
              {{ stats.financial?.transactions_count ?? 0 }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold mb-4 dark:text-white text-gray-700">
              Evolução de Receita (1 ano)
            </h3>
            <div class="h-64 relative">
              <Line
                v-if="chartLoaded && !chartError && revenueChartData.labels.length > 0"
                :data="revenueChartData"
                :options="chartOptions"
              />

              <div
                v-else-if="chartError"
                class="flex flex-col items-center justify-center h-full text-red-500"
              >
                <span>⚠️ Erro ao carregar dados</span>
              </div>

              <div
                v-else-if="chartLoaded && revenueChartData.labels.length === 0"
                class="flex flex-col items-center justify-center h-full text-gray-400"
              >
                <span>📉 Sem dados no último ano</span>
              </div>

              <div v-else class="flex items-center justify-center h-full text-gray-400">
                <span class="animate-pulse">A carregar gráfico...</span>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold mb-4 dark:text-white text-gray-700">
              Atividade de Jogos (1 ano)
            </h3>
            <div class="h-64 relative">
              <Bar
                v-if="chartLoaded && !chartError && activityChartData.labels.length > 0"
                :data="activityChartData"
                :options="chartOptions"
              />

              <div
                v-else-if="chartError"
                class="flex flex-col items-center justify-center h-full text-red-500"
              >
                <span>⚠️ Erro ao carregar dados</span>
              </div>

              <div
                v-else-if="chartLoaded && activityChartData.labels.length === 0"
                class="flex flex-col items-center justify-center h-full text-gray-400"
              >
                <span>🎲 Sem jogos no último ano</span>
              </div>

              <div v-else class="flex items-center justify-center h-full text-gray-400">
                <span class="animate-pulse">A carregar gráfico...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isExactAdmin">
      <section>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Utilizadores
                </div>
                <div class="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
                  {{ stats?.users?.total ?? 0 }}
                </div>
              </div>
              <div class="text-gray-400 dark:text-gray-500 text-3xl">👥</div>
            </div>
            <div class="mt-4">
              <router-link
                to="/admin/users"
                class="text-sm font-medium text-blue-600 hover:underline"
                >Gerir utilizadores →</router-link
              >
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Admins
                </div>
                <div class="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
                  {{ stats?.users?.admins ?? 0 }}
                </div>
              </div>
              <div class="text-gray-400 dark:text-gray-500 text-3xl">🛡️</div>
            </div>
            <div class="mt-4">
              <span class="text-xs text-gray-400">{{ stats?.users?.blocked ?? 0 }} bloqueados</span>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Partidas Totais
                </div>
                <div class="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
                  {{ stats?.activity?.matches ?? 0 }}
                </div>
              </div>
              <div class="text-gray-400 dark:text-gray-500 text-3xl">🃏</div>
            </div>
            <div class="mt-4">
              <div class="text-xs text-gray-400">{{ stats?.activity?.games ?? 0 }} sub-jogos</div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Receita
                </div>
                <div class="mt-2 text-2xl font-extrabold text-green-600 dark:text-green-400">
                  {{ stats?.financial?.purchases_euros?.toFixed(2) ?? '0.00' }}€
                </div>
              </div>
              <div class="text-gray-400 dark:text-gray-500 text-3xl">💰</div>
            </div>
            <div class="mt-4">
              <div class="text-xs text-gray-400">
                {{ stats?.financial?.purchases_count ?? 0 }} compras feitas
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Histórico de Transações
          </h2>
          <div v-if="loading" class="text-gray-500 dark:text-gray-400 py-4">
            A carregar dados...
          </div>
          <ul v-else class="space-y-2">
            <li v-if="transactions.length === 0" class="text-gray-500 dark:text-gray-400 italic">
              Sem transações recentes para mostrar
            </li>
            <li
              v-for="t in transactions"
              :key="t.id"
              class="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ t.user_id ? `User #${t.user_id}` : '—' }} — {{ t.coins }} moedas
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t.transaction_datetime }}
                </div>
              </div>
              <div class="flex items-center gap-3">
                <router-link
                  v-if="t.user_id"
                  :to="{ name: 'user-details', params: { id: t.user_id } }"
                  class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >Perfil</router-link
                >
                <a
                  href="#"
                  class="text-sm text-gray-500 hover:text-gray-700"
                  @click.prevent="loadMoreTransactions"
                  >Carregar mais</a
                >
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <div class="mt-4">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
} from 'chart.js'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { useAdminChartsStore } from '@/stores/adminCharts'
import { toast } from 'vue-sonner'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
)

const apiStore = useAPIStore()
const authStore = useAuthStore()
const route = useRoute()

const transactions = ref([])
const txPagination = ref({ current_page: 1, per_page: 6, total: 0, last_page: 1 })
const txPage = ref(1)
const txPerPage = ref(6)
const stats = ref(null)
const loading = ref(false)
const adminName = computed(() => authStore.currentUser?.name)

// Chart state
const chartLoaded = ref(false)
const chartError = ref(false) // Novo estado para erro
const revenueChartData = ref({ labels: [], datasets: [] })
const activityChartData = ref({ labels: [], datasets: [] })
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  interaction: { intersect: false, mode: 'index' },
  scales: {
    x: {
      ticks: {
        autoSkip: true,
        maxTicksLimit: 12,
        maxRotation: 0,
        minRotation: 0,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
}

const isExactAdmin = computed(() => {
  // Only treat exact /admin route (or named 'admin') as the place to show the dashboard UI.
  // This ensures nested admin child routes (e.g. /admin/users/507) still mount their <router-view/>
  // while the full dashboard UI is only visible at the root admin page.
  try {
    return typeof route.path === 'string' && (route.path === '/admin' || route.name === 'admin')
  } catch {
    return false
  }
})

const fetchDashboardData = async () => {
  loading.value = true
  chartLoaded.value = false
  chartError.value = false

  try {
    // 1. Stats
    const statsRes = await axios.get('/admin/stats')
    stats.value = statsRes.data

    // 2. Transactions (recent)
    try {
      const txRes = await axios.get('/admin/transactions', {
        params: { page: 1, per_page: 6 },
      })
      transactions.value = txRes.data?.data ?? []
      txPagination.value = txRes.data?.meta ?? {
        current_page: 1,
        per_page: 6,
        total: transactions.value.length,
        last_page: 1,
      }
      // reset page state
      txPage.value = 1
    } catch (txErr) {
      console.warn('Erro ao buscar transações:', txErr)
      transactions.value = []
      txPagination.value = { current_page: 1, per_page: 6, total: 0, last_page: 1 }
    }

    // 3. Charts (moving load to adminCharts store)
    try {
      // Use the adminCharts store to fetch and cache chart data
      const adminCharts = useAdminChartsStore()
      await adminCharts.fetchCharts({ days: 365 })
      const revenue = adminCharts.revenue
      const activity = adminCharts.activity

      revenueChartData.value = {
        labels: revenue.map((item) => item.date),
        datasets: [
          {
            label: 'Receita (€)',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            data: revenue.map((item) => item.total),
            tension: 0.3,
            fill: false,
            pointRadius: 1,
          },
        ],
      }

      activityChartData.value = {
        labels: activity.map((item) => item.date),
        datasets: [
          {
            label: 'Nº de Jogos',
            backgroundColor: '#3b82f6',
            data: activity.map((item) => item.total),
          },
        ],
      }
      // Sucesso
      chartLoaded.value = true
    } catch (chartErr) {
      console.warn('Erro ao carregar gráficos via store:', chartErr)
      // Marca como erro, mas não bloqueia o resto da página
      chartError.value = true
      chartLoaded.value = true // Importante para parar o loading
    }
  } catch (err) {
    console.error('Erro geral no Dashboard:', err)
    toast.error('Não foi possível carregar os dados.')
  } finally {
    loading.value = false
  }
}

const loadMoreTransactions = async () => {
  // Prevent loading beyond last page
  if (txPage.value >= (txPagination.value?.last_page || 1)) return
  txPage.value++
  try {
    const res = await axios.get('/admin/transactions', {
      params: { page: txPage.value, per_page: txPerPage.value },
    })
    const more = res.data?.data ?? []
    transactions.value = transactions.value.concat(more)
    txPagination.value = res.data?.meta ?? txPagination.value
  } catch (e) {
    console.warn('Erro ao carregar mais transações', e)
  }
}

onMounted(() => {
  // If the current path is under /admin, ensure dashboard data (charts, transactions) is loaded.
  // This handles F5 refreshes on nested admin routes like /admin/users/507.
  if (typeof route.path === 'string' && route.path.startsWith('/admin')) {
    fetchDashboardData()
  } else if (showDashboard.value) {
    // fallback (keeps previous behaviour)
    fetchDashboardData()
  }
})

watch(
  () => route.path,
  (newPath) => {
    // When navigating to any route under /admin, reload dashboard data.
    if (typeof newPath === 'string' && newPath.startsWith('/admin')) {
      fetchDashboardData()
    }
  },
)
</script>
