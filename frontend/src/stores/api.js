import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  // Use sessionStorage so token persists across refresh but is cleared when the tab/window is closed.
  const SESSION_TOKEN_KEY = 'apiToken'
  const token = ref(sessionStorage.getItem(SESSION_TOKEN_KEY) || undefined)

  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  //general
  const post = async (url, payload) => {
  return axios.post(`${API_BASE_URL}${url}`, payload)
}

  // AUTH
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    token.value = response.data.token
    if (token.value) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token.value)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    return response
  }

  const postLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`)
    } catch (err) {
      console.warn('API logout failed (continuing local cleanup):', err)
    } finally {
      token.value = undefined
      sessionStorage.removeItem(SESSION_TOKEN_KEY)
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const postRegister = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/register`, credentials)
    token.value = response.data.token
    if (token.value) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token.value)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    return response
  }

  // Users
  const getAllUsers = async (page = 1, perPage = 20) => {
  return axios.get(`${API_BASE_URL}/admin/users`, {
    params: { page, per_page: perPage },
  })
}
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  const putUser = (user) => {
    return axios.put(`${API_BASE_URL}/users/${user.id}`, user)
  }

  const patchUserPhoto = (id, photo_url) => {
    return axios.patch(`${API_BASE_URL}/users/${id}/photo-url`, { photo_url })
  }

  const postDeleteAccount = (current_password) => {
    return axios.patch(`${API_BASE_URL}/users/me/deactivate`, { current_password })
  }

  const uploadProfilePhoto = async (file) => {
    const formData = new FormData()
    formData.append('photo', file)

    const uploadPromise = axios.post(`${API_BASE_URL}/files/userphoto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.promise(uploadPromise, {
      loading: 'Uploading profile photo...',
      success: () => `Profile photo uploaded successfully`,
      error: (data) => `Error uploading photo - ${data?.response?.data?.message}`,
    })

    return uploadPromise
  }


  // --- Users Admin ---
const deleteUser = (id) => {
  return axios.delete(`${API_BASE_URL}/admin/users/${id}`)
}

const deactivateUser = (id) => {
  return axios.patch(`${API_BASE_URL}/users/${id}/deactivate`)
}

const toggleBlockUser = (id) => {
  return axios.post(`${API_BASE_URL}/admin/users/${id}/toggle-block`)
}

const postUser = (payload) => {
  return post('/admin/users', payload)  // já tens o 'post' genérico
}


  // --- GAMES (Correção do erro "apiStore.getGames is not a function") ---
  const getGames = async () => {
    // Chama a rota pública de jogos que tens no api.php
    return axios.get(`${API_BASE_URL}/games`)
  }

  // Fetch user by ID (public profile data)
  const fetchUser = async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/profile`)
    return response.data
  }

  // Fetch all games for a specific user
  const fetchAllUserGames = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/games`, {
        params: { page, limit },
      })
      // Handle paginated response - extract games from data property
      return {
        games: response.data.data || [],
        pagination: {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
          per_page: response.data.per_page,
        },
      }
    } catch {
      console.warn('Full games API not available, falling back to recent games')
      // Fallback to existing recent games endpoint if full API doesn't exist
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/games/recent`)
      return { games: Array.isArray(response.data) ? response.data : [] }
    }
  }

  // Fetch all matches for a specific user
  const fetchAllUserMatches = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/matches`, {
        params: { page, limit },
      })
      // Handle paginated response - extract matches from data property
      return {
        matches: response.data.data || [],
        pagination: {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
          per_page: response.data.per_page,
        },
      }
    } catch {
      console.warn('Full matches API not available, falling back to recent matches')
      // Fallback to existing recent matches endpoint if full API doesn't exist
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/matches/recent`)
      return { matches: Array.isArray(response.data) ? response.data : [] }
    }
  }

  // LEADERBOARDS
  const getLeaderboardsAll = async (period = 'all', limit = 5) => {
    const response = await axios.get(`${API_BASE_URL}/leaderboards/all`, {
      params: { period, limit },
    })
    return response
  }

  const getLeaderboard = async (type, period = 'all', limit = 10) => {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`, {
      params: { type, period, limit },
    })
    return response
  }

  return {
    postLogin,
    postLogout,
    postRegister,
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
    post,
     postUser,        // criar usuário
    deleteUser,      // remover usuário
    toggleBlockUser, // bloquear/desbloquear usuário
    deactivateUser, 
  }
})
