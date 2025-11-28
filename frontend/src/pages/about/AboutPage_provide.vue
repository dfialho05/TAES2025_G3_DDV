<script setup>
import { ref, onMounted, inject } from 'vue'

const socket = inject('socket')
const api = ref({})
const received = ref('')
const message = ref('Hello from VueJS')

socket.on('echo', (msg) => {
  received.value = msg
})


onMounted(async () => {

  const response = await fetch('http://localhost:8000/api/metadata', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })
  api.value = await response.json()

})
</script>

<template>
  <div>
    <h1>Distributed Application Developent</h1>
    <h2>Worksheet 2 - About Page</h2>
    <main>
      This is the about page for Worksheet 2, where we will be exploring the basics of VueJS, Laravel and SocketIO.
      <section>
        <h3>REST API</h3>
        <div>
          <strong>API Name:</strong><span>{{ api.name }}</span>
        </div>
        <div>
          <strong>API Version:</strong><span>{{ api.version }}</span>
        </div>
      </section>
      <section>
        <h3>Web Socket</h3>
        <div>
          <strong>Connection:</strong><span>{{ socket.connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <div>
          <form>
            <label for="message">Message:</label>
            <input id="message" v-model="message" />
            <button type="button" @click="socket.emit('echo', message)">Send</button>
            <p>Received: {{ received }}</p>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>
