import { createApp } from 'vue'
import { io } from 'socket.io-client'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const API_BASE_URL = 'http://localhost:8000/api'
const SERVER_BASE_URL = 'http://localhost:8000'

// Configurações do Axios
axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common['Accept'] = 'application/json'
// PERMITE ENVIAR/RECEBER COOKIES
axios.defaults.withCredentials = true

// Interceptor para enviar CSRF token automaticamente
axios.interceptors.request.use((config) => {
  // Extrai o token CSRF do cookie XSRF-TOKEN
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]

  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token)
  }

  return config
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const socket = io('http://localhost:3000', {
  withCredentials: true,
})
app.provide('socket', socket)

app.provide('apiBaseURL', API_BASE_URL)
app.provide('serverBaseURL', SERVER_BASE_URL)

const authStore = useAuthStore()
authStore.init()

app.mount('#app')
