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
    // Try to notify the backend (optional). Always clear local session state afterwards.
    try {
      await axios.post(`${API_BASE_URL}/logout`)
    } catch (err) {
      // Não impedimos a limpeza local se o logout no servidor falhar.
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

  // Deactivate current user's account (expects { current_password })
  const deleteAccount = (current_password) => {
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

  return {
    postLogin,
    postLogout,
    postRegister,
    getAuthUser,
    putUser,
    patchUserPhoto,
    deleteAccount,
    uploadProfilePhoto,
  }
})
