<template>
  <div class="max-w-3xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Comprar Coins</CardTitle>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="onSubmit" class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Valor (EUR)</label>
            <div class="flex items-center gap-4">
              <Input v-model="euros" type="number" class="w-full sm:w-40" placeholder="1" min="1" />
              <div
                class="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-md border"
              >
                Recebe: <span class="text-primary font-bold">{{ calculatedCoins }}</span> Coins
              </div>
            </div>

            <p class="text-xs text-muted-foreground mt-1">
              Taxa de conversão: 1€ = 10 Coins. Introduza um valor inteiro (>= 1).
            </p>

            <div v-if="localError && localErrorField === 'euros'" class="text-sm text-red-600 mt-1">
              {{ localError }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Tipo de pagamento</label>
            <select
              v-model="paymentType"
              class="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option v-for="t in paymentTypes" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Referência de pagamento</label>
            <Input v-model="paymentReference" type="text" :placeholder="paymentPlaceholder" />
            <p class="text-xs text-muted-foreground mt-1">
              Formato esperado varia conforme o tipo de pagamento.
            </p>
            <div
              v-if="localError && localErrorField === 'payment_reference'"
              class="text-sm text-red-600 mt-1"
            >
              {{ localError }}
            </div>
            <div v-else-if="serverPaymentReferenceError" class="text-sm text-red-600 mt-1">
              {{ serverPaymentReferenceError }}
            </div>
          </div>

          <div
            v-if="purchase.error"
            class="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
          >
            <strong>Pagamento Rejeitado:</strong> {{ purchase.error }}
          </div>

          <div
            v-if="purchase.success"
            class="p-4 rounded-md bg-green-50 border border-green-200 text-green-800"
          >
            <div class="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h3 class="font-bold text-lg">{{ purchase.success.message }}</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div class="bg-white/60 p-2 rounded border border-green-100">
                <span class="block text-xs text-green-600 uppercase font-semibold"
                  >Coins Creditadas</span
                >
                <span class="text-xl font-bold">{{ purchase.success.coins_credited }}</span>
              </div>
              <div class="bg-white/60 p-2 rounded border border-green-100">
                <span class="block text-xs text-green-600 uppercase font-semibold">Novo Saldo</span>
                <span class="text-xl font-bold">{{ purchase.success.new_balance }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-3 mt-4">
            <Button
              :disabled="purchase.loading"
              variant="default"
              type="submit"
              class="w-full sm:w-auto"
            >
              <span v-if="!purchase.loading">Comprar Agora</span>
              <span v-else>A processar pagamento...</span>
            </Button>

            <Button type="button" variant="outline" @click="onReset" :disabled="purchase.loading" class="w-full sm:w-auto">
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePurchaseStore } from '@/stores/purchase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Local form state
const euros = ref('')
const paymentType = ref('MBWAY')
const paymentReference = ref('')

// Compute coins based on Euros input (1 EUR = 10 Coins)
const calculatedCoins = computed(() => {
  const val = parseInt(euros.value)
  return isNaN(val) || val < 0 ? 0 : val * 10
})

const paymentTypes = ['MBWAY', 'IBAN', 'MB', 'VISA', 'PAYPAL']

const paymentPlaceholder = computed(() => {
  switch (paymentType.value) {
    case 'MBWAY':
      return '9XXXXXXXX (9 dígitos, começa por 9)'
    case 'PAYPAL':
      return 'email@example.com'
    case 'IBAN':
      return 'PT00XXXXXXXXXXXX... (2 letras + 23 dígitos)'
    case 'MB':
      return '12345-123456789'
    case 'VISA':
      return '4XXXXXXXXXXXXXXX (16 dígitos, começa por 4)'
    default:
      return ''
  }
})

// Validation State
const localError = ref(null)
const localErrorField = ref(null)

const purchase = usePurchaseStore()

// Local Validation Logic
const validateLocal = () => {
  localError.value = null
  localErrorField.value = null

  const v = Number(euros.value)
  if (!Number.isInteger(v) || v < 1) {
    localErrorField.value = 'euros'
    localError.value = 'O valor deve ser um inteiro positivo (mínimo 1€).'
    return false
  }

  if (!paymentTypes.includes(paymentType.value)) {
    localErrorField.value = 'payment_type'
    localError.value = 'Tipo de pagamento inválido.'
    return false
  }

  const refVal = String(paymentReference.value || '').trim()
  if (!refVal) {
    localErrorField.value = 'payment_reference'
    localError.value = 'A referência de pagamento é obrigatória.'
    return false
  }

  switch (paymentType.value) {
    case 'MBWAY':
      if (!/^9\d{8}$/.test(refVal)) {
        localErrorField.value = 'payment_reference'
        localError.value = 'MBWAY: 9 dígitos iniciando por 9.'
        return false
      }
      break
    case 'PAYPAL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(refVal)) {
        localErrorField.value = 'payment_reference'
        localError.value = 'PAYPAL: email inválido.'
        return false
      }
      break
    case 'IBAN':
      if (!/^[A-Z]{2}\d{23}$/.test(refVal)) {
        localErrorField.value = 'payment_reference'
        localError.value = 'IBAN: 2 letras maiúsculas + 23 dígitos.'
        return false
      }
      break
    case 'MB':
      if (!/^\d{5}-\d{9}$/.test(refVal)) {
        localErrorField.value = 'payment_reference'
        localError.value = 'MB: formato 12345-123456789.'
        return false
      }
      break
    case 'VISA':
      if (!/^4\d{15}$/.test(refVal)) {
        localErrorField.value = 'payment_reference'
        localError.value = 'VISA: 16 dígitos começando por 4.'
        return false
      }
      break
  }

  return true
}

// Server Validation Mapping
const serverPaymentReferenceError = computed(() => {
  const fe = purchase.fieldErrors
  if (fe && fe.payment_reference) {
    return Array.isArray(fe.payment_reference)
      ? fe.payment_reference.join(' ')
      : String(fe.payment_reference)
  }
  if (purchase.error && typeof purchase.error === 'string') {
    const msg = purchase.error.toLowerCase()
    if (msg.includes('referência') || msg.includes('reference')) return purchase.error
  }
  return null
})

const onSubmit = async () => {
  purchase.clear()
  localError.value = null
  localErrorField.value = null

  if (!validateLocal()) {
    return
  }

  const payload = {
    euros: Number(euros.value),
    payment_type: paymentType.value,
    payment_reference: paymentReference.value,
  }

  // Call Store
  const res = await purchase.initiatePurchase(payload)

  if (!res.ok) {
    return
  }

  // On success, clear form fields but keep the success message
  euros.value = ''
  paymentType.value = 'MBWAY'
  paymentReference.value = ''
}

const onReset = () => {
  euros.value = ''
  paymentType.value = 'MBWAY'
  paymentReference.value = ''
  localError.value = null
  localErrorField.value = null
  purchase.clear()
}
</script>

<style scoped>
/* No specific styles needed if using Tailwind/Shadcn UI */
</style>
