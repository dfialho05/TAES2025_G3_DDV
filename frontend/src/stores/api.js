import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  // --- AUTH ---
  const postLogin = async (credentials) => {
    // O Laravel enviará o cookie 'auth_token' no Set-Cookie header
    return await axios.post('/login', credentials)
  }

  const postLogout = async () => {
    try {
      await axios.post('/logout')
    } catch (err) {
      console.warn('API logout failed:', err)
    }
    // O browser limpa o cookie automaticamente quando o Laravel responde
    // com o helper ->withoutCookie('auth_token')
  }

  const postRegister = async (credentials) => {
    return await axios.post('/register', credentials)
  }

  /**
   * Create an API token for the currently authenticated session user.
   * This calls the backend endpoint POST /api/token which should return { token: '...' }.
   * Used by the frontend when login/register do not return a token directly.
   */
  const createApiToken = async () => {
    try {
      const res = await axios.post('/token')
      return res.data?.token ?? null
    } catch (err) {
      console.warn('API create token failed:', err)
      return null
    }
  }

  const getAuthUser = async () => {
    const res = await axios.get('/users/me')
    return res.data
  }

  // --- USERS & PROFILE ---
  const putUser = (user) => axios.patch('/users/me', user)

  const patchUserPhoto = (id, photo_url) => {
    return axios.patch(`/users/${id}/photo-url`, { photo_url })
  }

  const postDeleteAccount = (current_password) => {
    return axios.patch('/users/me/deactivate', { current_password })
  }

  const uploadProfilePhoto = async (file) => {
    const formData = new FormData()
    formData.append('photo', file)

    const uploadPromise = axios.post('/files/userphoto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.promise(uploadPromise, {
      loading: 'A carregar foto de perfil...',
      success: 'Foto atualizada com sucesso!',
      error: (data) => `Erro no upload - ${data?.response?.data?.message}`,
    })

    return uploadPromise
  }

  // --- ADMIN: USERS ---
  const getAllUsers = async (page = 1, perPage = 20, options = {}) => {
    const { q, sort } = options || {}

    const params = { page, per_page: perPage }
    if (q) params.q = q

    const res = await axios.get('/admin/users', { params })

    // Normalização da resposta para manter consistência no Frontend
    let usersArray = res.data.data ?? []
    let meta = res.data.meta ?? { current_page: page, last_page: 1, total: usersArray.length }

    if (sort === 'alpha_asc' || sort === 'alpha_desc') {
      usersArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      if (sort === 'alpha_desc') usersArray.reverse()
    }

    return { ...res, data: { data: usersArray, meta } }
  }

  const getUserById = (id) => axios.get(`/admin/users/${id}`)

  const deleteUser = (id) => axios.delete(`/admin/users/${id}`)

  const toggleBlockUser = async (id) => {
    const res = await axios.get(`/admin/users/${id}`)
    const user = res.data?.data ?? res.data
    return user.blocked
      ? axios.patch(`/admin/users/${id}/unblock`)
      : axios.patch(`/admin/users/${id}/block`)
  }

  const postUser = (payload) => {
    if (payload?.type === 'A') return axios.post('/admin/users/create-admin', payload)
    if (payload?.type) return axios.post('/users', payload)
    return postRegister(payload)
  }

  // --- TRANSACTIONS ---
  const getUserTransactions = (id, page = 1) => {
    return axios.get(`/admin/users/${id}/transactions`, { params: { page } })
  }

  const getSelfTransactions = async (page = 1, perPage = 50) => {
    const res = await axios.get('/transactions', { params: { page, per_page: perPage } })
    return {
      data: res.data.data ?? [],
      meta: res.data.meta ?? { current_page: page, last_page: 1, total: 0 },
    }
  }

  // --- GAMES & MATCHES ---
  const getGames = () => axios.get('/games')

  const fetchUser = (userId) => axios.get(`/users/${userId}/profile`).then((r) => r.data)

  const fetchAllUserGames = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    const res = await axios.get(`/users/${userId}/games`, { params: { page, limit } })
    return {
      games: res.data.data ?? [],
      pagination: { current_page: res.data.current_page, total: res.data.total },
    }
  }

  const fetchAllUserMatches = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    const res = await axios.get(`/users/${userId}/matches`, { params: { page, limit } })
    return {
      matches: res.data.data ?? [],
      pagination: { current_page: res.data.current_page, total: res.data.total },
    }
  }

  // --- LEADERBOARDS ---
  const getLeaderboard = (type, period = 'all', limit = 10) => {
    return axios.get('/leaderboard', { params: { type, period, limit } })
  }

  const getLeaderboardsAll = (period = 'all', limit = 5) => {
    return axios.get('/leaderboards/all', { params: { period, limit } })
  }

  return {
    postLogin,
    postLogout,
    postRegister,
    createApiToken,
    getAuthUser,
    putUser,
    fetchUser,
    patchUserPhoto,
    postDeleteAccount,
    uploadProfilePhoto,
    getGames,
    fetchAllUserGames,
    fetchAllUserMatches,
    getLeaderboardsAll,
    getLeaderboard,
    getAllUsers,
    postUser,
    deleteUser,
    toggleBlockUser,
    getUserById,
    getUserTransactions,
    getSelfTransactions,
  }
})
