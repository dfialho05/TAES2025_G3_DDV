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
    // Use relative path since axios.defaults.baseURL is set in main.js
    return axios.post(url, payload)
  }

  // AUTH
  const postLogin = async (credentials) => {
    const response = await axios.post('/login', credentials)
    token.value = response.data.token
    if (token.value) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token.value)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    return response
  }

  const postLogout = async () => {
    try {
      await axios.post('/logout')
    } catch (err) {
      console.warn('API logout failed (continuing local cleanup):', err)
    } finally {
      token.value = undefined
      sessionStorage.removeItem(SESSION_TOKEN_KEY)
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const postRegister = async (credentials) => {
    const response = await axios.post('/register', credentials)
    token.value = response.data.token
    if (token.value) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token.value)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    return response
  }

  // Users
  /**
   * Get users with server-side pagination.
   *
   * Extended options:
   *  - options.q: optional search query (forwarded to backend when present)
   *  - options.sort: optional client-side sort: 'alpha_asc' | 'alpha_desc'
   *
   * The backend already supports `q` and server-side filtering, but we accept it here
   * as an option and also provide a client-side alphabetical fallback sorting when requested.
   */
  const getAllUsers = async (page = 1, perPage = 20, options = {}) => {
    const { q, sort } = options || {}

    // Ensure Authorization header is set from sessionStorage before each request
    const SESSION_TOKEN_KEY = 'apiToken'
    const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    } else {
      // remove any leftover header to avoid sending invalid credentials
      delete axios.defaults.headers.common['Authorization']
    }

    const buildParams = () => {
      const params = { page, per_page: perPage }
      if (q) params.q = q
      return params
    }

    const postProcessResponse = (res) => {
      // Normalize payload into { data: [...], meta: {...} }
      const payload = res.data ?? {}
      let usersArray = []
      let meta = null

      if (payload && (payload.data || payload.meta)) {
        usersArray = payload.data || []
        meta = payload.meta || {
          current_page: page,
          per_page: perPage,
          total: Array.isArray(usersArray) ? usersArray.length : 0,
          last_page: 1,
        }
      } else {
        // fallback if the API returned a plain array
        usersArray = Array.isArray(payload) ? payload : []
        meta = {
          current_page: page,
          per_page: perPage,
          total: usersArray.length,
          last_page: 1,
        }
      }

      // Client-side fallback filtering (only if q was provided but backend didn't filter)
      // This covers cases where backend endpoint doesn't support q, or in fallback scenarios.
      if (q && usersArray.length > 0) {
        const qLower = String(q).toLowerCase()
        // Only run the client-side filter if it's necessary (i.e., results don't obviously reflect filtering).
        // We do a permissive check: if none of the returned items contain q in name/email/nickname, apply local filter.
        const hasMatch = usersArray.some((u) =>
          ((u.name || '') + ' ' + (u.nickname || '') + ' ' + (u.email || ''))
            .toLowerCase()
            .includes(qLower),
        )
        if (!hasMatch) {
          usersArray = usersArray.filter((u) =>
            ((u.name || '') + ' ' + (u.nickname || '') + ' ' + (u.email || ''))
              .toLowerCase()
              .includes(qLower),
          )
          meta.total = usersArray.length
        }
      }

      // Client-side alphabetical sorting if requested
      if (sort === 'alpha_asc' || sort === 'alpha_desc') {
        usersArray.sort((a, b) => {
          const an = (a.name || '').toString().toLowerCase()
          const bn = (b.name || '').toString().toLowerCase()
          if (an < bn) return -1
          if (an > bn) return 1
          return 0
        })
        if (sort === 'alpha_desc') {
          usersArray.reverse()
        }
      }

      // Return a response-like object to keep callers consistent
      return {
        ...res,
        data: {
          data: usersArray,
          meta,
        },
      }
    }

    // server-side pagination endpoint (relative path)
    // Implement simple retry/auth-refresh logic:
    // - On 401, re-check sessionStorage for an updated token and retry once.
    try {
      const res = await axios.get('/admin/users', {
        params: buildParams(),
      })
      return postProcessResponse(res)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        // Try to recover by reloading token from sessionStorage (maybe another tab refreshed it)
        const SESSION_TOKEN_KEY = 'apiToken'
        const refreshedToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
        if (refreshedToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${refreshedToken}`
          try {
            const res2 = await axios.get('/admin/users', {
              params: buildParams(),
            })
            return postProcessResponse(res2)
          } catch (err2) {
            // if retry fails, propagate original retry error
            throw err2
          }
        }
      }
      // Not a 401 or no token to refresh -> propagate
      throw err
    }
  }
  const getAuthUser = () => {
    return axios.get('/users/me')
  }

  const putUser = (user) => {
    return axios.put(`/users/${user.id}`, user)
  }

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
      loading: 'Uploading profile photo...',
      success: () => `Profile photo uploaded successfully`,
      error: (data) => `Error uploading photo - ${data?.response?.data?.message}`,
    })

    return uploadPromise
  }

  // --- Users Admin ---
  const deleteUser = (id) => {
    return axios.delete(`/admin/users/${id}`)
  }

  const deactivateUser = (id) => {
    return axios.patch(`/users/${id}/deactivate`)
  }

  /**
   * Toggle block state for a user.
   * This fetches the current user state and calls the correct admin endpoint.
   * - If the user is currently blocked -> call PATCH /admin/users/{id}/unblock
   * - If the user is currently active  -> call PATCH /admin/users/{id}/block
   */
  const toggleBlockUser = async (id) => {
    // Fetch the latest user info to determine blocked state.
    const res = await axios.get(`/admin/users/${id}`)
    // The API may return a UserResource wrapped object or the raw user object.
    const user = res.data?.data ? res.data.data : res.data
    const blocked = user?.blocked ?? false

    if (blocked) {
      return axios.patch(`/admin/users/${id}/unblock`)
    } else {
      return axios.patch(`/admin/users/${id}/block`)
    }
  }

  /**
   * Create a user.
   * - If payload.type === 'A' use the admin endpoint to create an admin
   * - If creating a regular user as admin use authenticated POST /users
   * - If no type is provided and this should be a public registration, fallback to /register
   */
  const postUser = (payload) => {
    if (payload && payload.type === 'A') {
      return post('/admin/users/create-admin', payload)
    }

    // If payload explicitly indicates player/admin creation via authenticated users endpoint
    if (payload && payload.type) {
      return post('/users', payload)
    }

    // Fallback to public registration when no type is provided
    return post('/register', payload)
  }

  //userdetails transaction
  const getUserById = async (id) => {
    // Garantir que usa /admin/ para bater na rota protegida
    return axios.get(`/admin/users/${id}`)
  }

  const getUserTransactions = async (id, page = 1) => {
    return axios.get(`/admin/users/${id}/transactions`, {
      params: { page },
    })
  }

  // --- GAMES (Correção do erro "apiStore.getGames is not a function") ---
  const getGames = async () => {
    // Chama a rota pública de jogos que tens no api.php
    return axios.get('/games')
  }

  // Fetch user by ID (public profile data)
  const fetchUser = async (userId) => {
    const response = await axios.get(`/users/${userId}/profile`)
    return response.data
  }

  // Fetch all games for a specific user
  const fetchAllUserGames = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    try {
      const response = await axios.get(`/users/${userId}/games`, {
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
      const response = await axios.get(`/users/${userId}/games/recent`)
      return { games: Array.isArray(response.data) ? response.data : [] }
    }
  }

  // Fetch all matches for a specific user
  const fetchAllUserMatches = async (userId, options = {}) => {
    const { page = 1, limit = 50 } = options
    try {
      const response = await axios.get(`/users/${userId}/matches`, {
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
      const response = await axios.get(`/users/${userId}/matches/recent`)
      return { matches: Array.isArray(response.data) ? response.data : [] }
    }
  }

  // LEADERBOARDS
  const getLeaderboardsAll = async (period = 'all', limit = 5) => {
    const response = await axios.get('/leaderboards/all', {
      params: { period, limit },
    })
    return response
  }

  const getLeaderboard = async (type, period = 'all', limit = 10) => {
    const response = await axios.get('/leaderboard', {
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
    postUser, // criar usuário
    deleteUser, // remover usuário
    toggleBlockUser, // bloquear/desbloquear usuário
    deactivateUser,
    getUserById,
    getUserTransactions,
  }
})
