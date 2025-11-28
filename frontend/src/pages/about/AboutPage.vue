<script setup>
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto space-y-8">

      <div class="text-center space-y-2">
        <h1 class="text-4xl font-bold text-slate-900 tracking-tight">
          Distributed Application Development
        </h1>
        <p class="text-lg text-slate-600">
          Worksheet 2 - About Page
        </p>
      </div>


      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <p class="text-slate-700 leading-relaxed">
          This is the about page for Worksheet 2, where we will be exploring the basics of
          <span class="font-semibold text-emerald-600">VueJS</span>,
          <span class="font-semibold text-red-600">Laravel</span>, and
          <span class="font-semibold text-blue-600">SocketIO</span>.
        </p>
      </div>


      <section class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
          <h3 class="text-xl font-semibold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            REST API
          </h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-slate-100">
            <span class="text-sm font-medium text-slate-600">API Name</span>
            <span class="text-base font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
              {{ api.name }}
            </span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-sm font-medium text-slate-600">API Version</span>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
              v{{ api.version }}
            </span>
          </div>
        </div>
      </section>


      <section class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h3 class="text-xl font-semibold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Web Socket
          </h3>
        </div>
        <div class="p-6 space-y-6">

          <div class="flex items-center justify-between py-3 border-b border-slate-100">
            <span class="text-sm font-medium text-slate-600">Connection Status</span>
            <span :class="[
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              socket.connected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            ]">
              <span :class="[
                'w-2 h-2 rounded-full',
                socket.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              ]"></span>
              {{ socket.connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>


          <div class="space-y-4">
            <div>
              <label for="message" class="block text-sm font-medium text-slate-700 mb-2">
                Send Message
              </label>
              <div class="flex gap-3">
                <Input id="message" v-model="message" type="text" placeholder="Type your message..." class="flex-1" />
                <Button type="button" @click="socket.emit('echo', message)">
                  Send
                </Button>
              </div>
            </div>


            <div v-if="received" class="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p class="text-xs font-medium text-slate-500 mb-1">Received Message:</p>
              <p class="text-slate-900 font-medium">{{ received }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
