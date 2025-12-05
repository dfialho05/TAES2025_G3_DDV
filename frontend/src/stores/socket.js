// stores/socket.js
import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket') // Pega o socket do main.js
  const joined = ref(false)

  // Ocorre quando o socket liga efetivamente
  const handleConnection = () => {
    socket.on('connect', () => {
      console.log(`[Socket] Connected -- ${socket.id}`)
    })

    socket.on('disconnect', () => {
      joined.value = false
      console.log(`[Socket] Disconnected`)
    })
  }

  // Diz ao servidor quem é o user (Login no socket)
  const emitJoin = (user) => {
    if (joined.value) return
    console.log(`[Socket] Joining Server as ${user.name}`)
    socket.emit('join', user) // O evento que vimos no teu backend
    joined.value = true
  }

  const emitLeave = () => {
    socket.emit('leave')
    joined.value = false
  }

  return {
    socket, // Retornamos o socket para ser usado noutros stores
    emitJoin,
    emitLeave,
    handleConnection,
    joined
  }
})
