import { defineStore } from 'pinia'
import { ref, inject } from 'vue'
import axios from 'axios'

/**
 * Purchase store - only responsible for communicating with the API.
 * UI state (form fields, validation, etc.) must remain in the page component.
 *
 * Usage:
 *  const purchase = usePurchaseStore()
 *  await purchase.initiatePurchase({ euros, payment_type, payment_reference })
 */
export const usePurchaseStore = defineStore('purchase', () => {
  // Prefer injected base URL but allow fallback
  const API_BASE_URL = inject('apiBaseURL') || '/api'

  // API call state
  const loading = ref(false)
  const error = ref(null) // general error message
  const fieldErrors = ref(null) // server-provided validation details (422)
  const success = ref(null) // last successful response body

  /**
   * initiatePurchase
   * - payload: object with the API payload (e.g. { euros, payment_type, payment_reference })
   * - baseURL (optional): override the injected API base URL
   *
   * Returns { ok: boolean, data?, error?, status?, raw? }
   */
  const initiatePurchase = async (payload, baseURL) => {
    loading.value = true
    error.value = null
    fieldErrors.value = null
    success.value = null

    const url = `${baseURL || API_BASE_URL}/purchases/`

    try {
      const res = await axios.post(url, payload)

      // Save success and return
      success.value = res.data
      return { ok: true, data: res.data, status: res.status, raw: res }
    } catch (err) {
      // Normalize error information
      if (err && err.response) {
        const status = err.response.status
        const data = err.response.data

        if (status === 422) {
          // Validation errors from server
          fieldErrors.value = data
          error.value = data.message || 'Erros de validação no servidor.'
        } else {
          error.value = data?.message || `HTTP ${status}`
        }

        return { ok: false, error: error.value, status, data, raw: err.response }
      } else {
        // Network or unexpected error
        const msg = err?.message || 'Erro desconhecido'
        error.value = msg
        return { ok: false, error: msg, raw: err }
      }
    } finally {
      loading.value = false
    }
  }

  // Clear request state (useful for the UI to reset errors/success)
  function clear() {
    loading.value = false
    error.value = null
    fieldErrors.value = null
    success.value = null
  }

  return {
    // state
    loading,
    error,
    fieldErrors,
    success,

    // actions
    initiatePurchase,
    clear,
  }
})
