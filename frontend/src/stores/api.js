import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const token = ref()

  // AUTH
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    token.value = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response
  }
  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`)
    token.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }

  const postRegister = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/register`, credentials)
    token.value = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
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

  /*
  // GAMES
  const postGame = (game) => {
    return toast.promise(axios.post(`${API_BASE_URL}/games`, game), {
      loading: 'Sending data to API...',
      success: () => {
        return `[API] Game saved successfully`
      },
      error: (data) => `[API] Error saving game - ${data?.response?.data?.message}`,
    })
  }

  const getGames = () => {
    return axios.get(`${API_BASE_URL}/games`)
  }

  // Board Themes

  const getBoardThemes = async () => {
    return axios.get(`${API_BASE_URL}/board-themes`)
  }

  const postBoardTheme = async (data) => {
    return axios.post(`${API_BASE_URL}/board-themes`, data)
  }

  const postCardFace = async (data) => {
    return axios.post(`${API_BASE_URL}/card-faces`, data)
  }

  const deleteBoardTheme = async (id) => {
    return axios.delete(`${API_BASE_URL}/board-themes/${id}`)
  }
  */

  // Files

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

  /*
  const uploadCardFaces = async (files) => {
    const formData = new FormData()
    for (let file of files) {
      formData.append('cardfaces[]', file)
    }

    const uploadPromise = axios.post(`${API_BASE_URL}/files/cardfaces`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.promise(uploadPromise, {
      loading: 'Uploading Card Faces...',
      success: () => `Card Faces uploaded successfully`,
      error: (data) => `Error uploading Card Faces - ${data?.response?.data?.message}`,
    })

    return uploadPromise
  }
  */

  return {
    postLogin,
    postLogout,
    postRegister,
    getAuthUser,
    putUser,
    patchUserPhoto,
    deleteAccount,
    // postGame,
    // getGames,
    // getBoardThemes,
    // postBoardTheme,
    // postCardFace,
    uploadProfilePhoto,
    // uploadCardFaces,
    // deleteBoardTheme,
  }
})
