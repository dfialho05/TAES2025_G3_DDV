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

  // --- GAMES (Correção do erro "apiStore.getGames is not a function") ---
  const getGames = async () => {
    // Chama a rota pública de jogos que tens no api.php
    return axios.get(`${API_BASE_URL}/games`)
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
    patchUserPhoto,
    postDeleteAccount,
    uploadProfilePhoto,
    getGames,
    getLeaderboardsAll,
    getLeaderboard,
  }
})
