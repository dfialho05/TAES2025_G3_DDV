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
              Evolução de Lucro (7 dias)
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
                <span>📉 Sem dados nos últimos 7 dias</span>
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
              Atividade de Jogos (7 dias)
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
                <span>🎲 Sem jogos nos últimos 7 dias</span>
              </div>

              <div v-else class="flex items-center justify-center h-full text-gray-400">
                <span class="animate-pulse">A carregar gráfico...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDashboard">
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
            Utilizadores Recentes
          </h2>
          <div v-if="loading" class="text-gray-500 dark:text-gray-400 py-4">
            A carregar dados...
          </div>
          <ul v-else class="space-y-2">
            <li v-if="users.length === 0" class="text-gray-500 dark:text-gray-400 italic">
              Sem utilizadores recentes para mostrar
            </li>
            <li
              v-for="u in users"
              :key="u.id"
              class="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{{ u.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ u.email }}</div>
              </div>
              <div class="flex items-center gap-3">
                <span
                  :class="
                    u.type === 'A' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  "
                  class="text-[10px] px-2 py-0.5 rounded font-bold"
                  >{{ u.type === 'A' ? 'ADMIN' : 'PLAYER' }}</span
                >
                <router-link
                  :to="{ name: 'user-details', params: { id: u.id } }"
                  class="text-blue-500 hover:text-blue-700"
                  >👁️</router-link
                >
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <div v-else class="mt-4">
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

const users = ref([])
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
}

const showDashboard = computed(() => route.name === 'admin' || route.path === '/admin')

const fetchDashboardData = async () => {
  loading.value = true
  chartLoaded.value = false
  chartError.value = false

  try {
    // 1. Stats
    const statsRes = await axios.get('/admin/stats')
    stats.value = statsRes.data

    // 2. Users
    const usersRes = await apiStore.getAllUsers(1, 6)
    users.value = usersRes.data?.data ?? []

    // 3. Charts
    try {
      const chartsRes = await axios.get('/admin/charts')
      const { revenue = [], activity = [] } = chartsRes.data || {}

      revenueChartData.value = {
        labels: revenue.map((item) => item.date),
        datasets: [
          {
            label: 'Lucro (€)',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            data: revenue.map((item) => item.total),
            tension: 0.3,
            fill: false,
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
      console.warn('Erro nos gráficos:', chartErr)
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

onMounted(() => {
  if (showDashboard.value) fetchDashboardData()
})

watch(
  () => route.name,
  (newName) => {
    if (newName === 'admin') fetchDashboardData()
  },
)
</script>
