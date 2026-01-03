<template>
  <Transition name="slide-down">
    <div
      v-if="shouldShow"
      class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border"
      :class="statusClass"
    >
      <div class="flex items-center gap-3">
        <div v-if="isReconnecting || isRecovering" class="animate-spin">
          <svg
            class="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>

        <div v-else-if="!isConnected" class="w-5 h-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m-2.829-9.9a5 5 0 010 7.072m-8.688 2.829a9 9 0 01-2.829-2.829m2.829-9.9a5 5 0 000 7.072M21 12h.01M3 12h.01M12 3v.01M12 21v.01"
            />
          </svg>
        </div>

        <div>
          <p class="text-sm font-semibold">{{ statusMessage }}</p>
          <p v-if="reconnectAttempts > 0" class="text-xs opacity-80">
            Tentativa {{ reconnectAttempts }} de {{ maxAttempts }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSocketStore } from '@/stores/socket'
import { useBiscaStore } from '@/stores/biscaStore'

const socketStore = useSocketStore()
const biscaStore = useBiscaStore()

const { isConnected, isReconnecting, reconnectAttempts } = storeToRefs(socketStore)
const { isRecovering, connectionLost } = storeToRefs(biscaStore)

const maxAttempts = 10

const shouldShow = computed(() => {
  return !isConnected.value || isReconnecting.value || isRecovering.value || connectionLost.value
})

const statusMessage = computed(() => {
  if (isRecovering.value) {
    return 'A recuperar jogo...'
  }
  if (isReconnecting.value) {
    return 'A tentar reconectar...'
  }
  if (connectionLost.value) {
    return 'Conexão perdida. A reconectar...'
  }
  if (!isConnected.value) {
    return 'Desconectado do servidor'
  }
  return 'Conectado'
})

const statusClass = computed(() => {
  if (isRecovering.value || isReconnecting.value) {
    return 'bg-blue-500/90 text-white border-blue-600'
  }
  if (!isConnected.value || connectionLost.value) {
    return 'bg-red-500/90 text-white border-red-600'
  }
  return 'bg-green-500/90 text-white border-green-600'
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translate(-50%, -100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translate(-50%, -100%);
  opacity: 0;
}
</style>
