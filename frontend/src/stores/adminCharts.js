import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

/**
 * Store: adminCharts
 *
 * Responsável por buscar e reter os dados de gráficos do Admin Dashboard.
 * Expondo ações para carregar séries diárias de receita e atividade (jogos),
 * com suporte a especificar o número de dias a recuperar.
 *
 * Uso:
 *  const adminCharts = useAdminChartsStore()
 *  await adminCharts.fetchCharts({ days: 365 })
 *
 * Estado exposto:
 *  - revenue: array of { date: 'YYYY-MM-DD', total: number }
 *  - activity: array of { date: 'YYYY-MM-DD', total: number }
 *  - isLoading: boolean
 *  - error: null | string
 *  - lastFetchedDays: number | null
 *
 * A store não tenta manipular autenticação/headers; assume que axios já está
 * configurado globalmente (baseURL, Authorization).
 */
export const useAdminChartsStore = defineStore('adminCharts', () => {
  const revenue = ref([])
  const activity = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetchedDays = ref(null)

  /**
   * Fetch charts data from backend.
   * @param {Object} opts
   *  - days: number (optional) number of days to fetch (default 365)
   *  - force: boolean (optional) bypass cached same-days response (default false)
   */
  const fetchCharts = async (opts = {}) => {
    const days = Number(opts.days ?? 365) || 365
    const force = Boolean(opts.force ?? false)

    // If we've already fetched the same range and not forced, skip.
    if (lastFetchedDays.value === days && !force && revenue.value.length > 0 && activity.value.length > 0) {
      return { revenue: revenue.value, activity: activity.value }
    }

    isLoading.value = true
    error.value = null

    try {
      const res = await axios.get('/admin/charts', { params: { days } })
      const payload = res.data || {}

      // Normalize payload into expected arrays
      const rev = Array.isArray(payload.revenue) ? payload.revenue : []
      const act = Array.isArray(payload.activity) ? payload.activity : []

      // Ensure correct typing of totals and date strings
      revenue.value = rev.map((r) => {
        return {
          date: String(r.date ?? r.d ?? ''),
          total: Number(r.total ?? 0) || 0,
        }
      })

      activity.value = act.map((a) => {
        return {
          date: String(a.date ?? a.d ?? ''),
          total: Number(a.total ?? 0) || 0,
        }
      })

      lastFetchedDays.value = days
      return { revenue: revenue.value, activity: activity.value }
    } catch (err) {
      // Prefer server-provided message when available
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erro ao buscar dados dos gráficos'
      error.value = msg
      // reset arrays on error to avoid showing stale/partial data
      revenue.value = []
      activity.value = []
      lastFetchedDays.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetCharts = () => {
    revenue.value = []
    activity.value = []
    isLoading.value = false
    error.value = null
    lastFetchedDays.value = null
  }

  return {
    // state
    revenue,
    activity,
    isLoading,
    error,
    lastFetchedDays,

    // actions
    fetchCharts,
    resetCharts,
  }
})
