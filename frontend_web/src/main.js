import { createApp } from 'vue'
import { io } from 'socket.io-client'
//import { createPinia } from 'pinia'

//import App from './App.vue'
import AboutPage from '@/pages/about/AboutPage.vue'
//import router from './router'

const app = createApp(AboutPage)

const socket = io('http://localhost:3000')
app.provide('socket', socket)

//app.use(createPinia())
//app.use(router)

app.mount('#app')
