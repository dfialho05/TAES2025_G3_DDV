import { defineStore } from "pinia"
import { ref } from "vue"

export const useTransactionsStore = defineStore("transactions", () => {
  const transactions = ref([
    { id: 1, date: "2024-01-15 14:30", type: "purchase", amount: 100, description: "Compra de 100 moedas" },
    { id: 2, date: "2024-01-14 10:15", type: "game", amount: -20, description: "Entrada em jogo - Bisca de 3" },
    { id: 3, date: "2024-01-14 10:45", type: "win", amount: 40, description: "Vitória - Bisca de 3" },
    { id: 4, date: "2024-01-13 18:20", type: "purchase", amount: 50, description: "Compra de 50 moedas" },
    { id: 5, date: "2024-01-12 16:30", type: "game", amount: -30, description: "Entrada em jogo - Bisca de 9" },
  ])

  function addTransaction(transaction) {
    transactions.value.unshift({
      id: Date.now(),
      date: new Date().toLocaleString("pt-PT"),
      ...transaction,
    })
  }

  return {
    transactions,
    addTransaction,
  }
})
