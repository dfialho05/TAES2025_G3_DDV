import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'


import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const socket = io('http://localhost:3000')
app.provide('socket', socket)

//app.use(createPinia())
//app.use(router)

app.mount('#app')
