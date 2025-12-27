import { createApp } from 'vue'
import { io } from 'socket.io-client'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'

import router from './router'
import { useAuthStore } from './stores/auth'

const API_BASE_URL = 'http://localhost:8000/api'
const SERVER_BASE_URL = 'http://localhost:8000'

// Configurar baseURL do axios para que as chamadas relativas funcionem
axios.defaults.baseURL = API_BASE_URL
// Enviar Accept: application/json por omissão para evitar respostas HTML do Laravel
axios.defaults.headers.common['Accept'] = 'application/json'

const app = createApp(App)

const socket = io('http://localhost:3000')
app.provide('socket', socket)

app.provide('apiBaseURL', API_BASE_URL)
app.provide('serverBaseURL', SERVER_BASE_URL)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Restore token from sessionStorage (survives refresh but not closing the tab)
const SESSION_TOKEN_KEY = 'apiToken'
const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// If it fails (token expired/invalid), clear the session token and headers.
const authStore = useAuthStore()
if (token) {
  authStore.getUser().catch((err) => {
    console.warn('Failed to restore user from session token, clearing token:', err)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    delete axios.defaults.headers.common['Authorization']
  })
}

app.mount('#app')
