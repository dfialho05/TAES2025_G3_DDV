<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        <div class="bg-orange-500 px-6 py-4">
          <h2 class="text-2xl font-bold text-white">Jogo Anulado</h2>
        </div>

        <div class="p-6 space-y-4">
          <div class="flex items-start gap-3">
            <svg
              class="w-6 h-6 text-orange-500 flex-shrink-0 mt-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-gray-700 dark:text-gray-300">
                {{ message || 'O jogo foi encerrado devido a inatividade ou erro no servidor.' }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                As suas moedas foram devolvidas.
              </p>
            </div>
          </div>

          <div v-if="reason" class="bg-gray-100 dark:bg-gray-700 rounded p-3">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium">Motivo:</p>
            <p class="text-sm text-gray-800 dark:text-gray-200 mt-1">{{ reason }}</p>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            @click="handleClose"
            class="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  reason: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active > div,
.fade-leave-active > div {
  transition: transform 0.3s ease;
}

.fade-enter-from > div {
  transform: scale(0.9);
}

.fade-leave-to > div {
  transform: scale(0.9);
}
</style>
