import { createApp } from 'vue'
import { io } from 'socket.io-client'
import { createPinia } from 'pinia'

import App from './App.vue'

import router from './router'


const API_BASE_URL = 'http://localhost:8000/api'
const SERVER_BASE_URL = 'http://localhost:8000'

const app = createApp(App)

const socket = io('http://localhost:3000')
app.provide('socket', socket)
app.provide('apiBaseURL', API_BASE_URL)
app.provide('serverBaseURL', SERVER_BASE_URL)

app.use(createPinia())
app.use(router)

app.mount('#app')
