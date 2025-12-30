<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/game/Card.vue'

const router = useRouter()

// Tutorial completo
const tutorialSteps = [
  { title: 'Bem-vindo à Bisca', text: 'A Bisca é um jogo tradicional português para dois jogadores. O objetivo é ganhar 61 ou mais pontos. Vamos aprender as regras e ver exemplos de jogadas!', icon: '🧠' },
  { title: 'O Baralho', text: 'Usa-se um baralho de 40 cartas. Cada naipe tem Ás, 2, 3, 4, 5, 6, 7, Valete, Dama e Rei. Não existem 8, 9 e 10.', icon: '🃏' },
  { title: 'Distribuição e Trunfo', text: 'Cada jogador recebe 3 cartas. A carta do topo do monte é revelada como trunfo. O trunfo vence qualquer carta de outro naipe.', icon: '⭐' },
  { title: 'Valor das Cartas', text: 'Ás (11), Sete (10), Rei (4), Valete (3), Dama (2). As restantes valem 0. Pontos altos são estratégicos.', icon: '📊' },
  { title: 'Como Jogar uma Jogada', text: 'Cada jogador joga uma carta por turno. Quem jogar a carta mais alta do mesmo naipe ou um trunfo vence a jogada.', icon: '✋' },
  { title: 'Exemplo 1: Trunfo vence', text: 'Jogador 1: Ás de Copas. Jogador 2: 7 de Espadas (trunfo). O trunfo ganha!', icon: '🏆',
    example: { player1: { rank: 'A', naipe: 'c' }, player2: { rank: '7', naipe: 'e', trump: true }, winner: 2 }
  },
  { title: 'Exemplo 2: Carta alta do mesmo naipe', text: 'Jogador 1: 7 de Copas. Jogador 2: Valete de Copas. Carta mais alta do mesmo naipe vence.', icon: '⚡',
    example: { player1: { rank: '7', naipe: 'c' }, player2: { rank: 'J', naipe: 'c' }, winner: 2 }
  },
  { title: 'Estratégia Básica', text: 'Guarde os trunfos para momentos críticos e tente antecipar as cartas do adversário. Jogar cartas altas cedo pode ser arriscado.', icon: '🧩' },
  { title: 'Dicas Avançadas', text: 'Observe quais cartas já foram jogadas, controle o naipe de trunfo e tente forçar o adversário a gastar cartas altas primeiro.', icon: '💡' },
  { title: 'Objetivo Final', text: 'O jogo termina quando todas as cartas forem jogadas. Quem atingir 61 ou mais pontos vence a partida.', icon: '🎉' },
  { title: 'Hora de Treinar!', text: 'Agora é a tua vez de experimentar jogar uma mão de Bisca contra um bot simples. Clique numa carta para jogar.', icon: '🎮', isInteractive: true },
]

// Estado tutorial
const step = ref(0)
const highlightWinner = ref(false)

// Mini-jogo interativo
const playerHand = ref([
  { rank: 'A', naipe: 'c', id: 1 },
  { rank: '7', naipe: 'p', id: 2 },
  { rank: 'J', naipe: 'o', id: 3 },
])
const botHand = ref([
  { rank: '6', naipe: 'e', id: 4 },
  { rank: '3', naipe: 'p', id: 5 },
  { rank: 'Q', naipe: 'o', id: 6 },
])
const tableCards = ref([])
const trunfo = ref({ rank: '7', naipe: 'e' })
const score = ref({ me: 0, bot: 0 })
const currentTurn = ref('player')

// Jogar carta do jogador
const playCard = (index) => {
  if (currentTurn.value !== 'player') return
  const card = playerHand.value.splice(index, 1)[0]
  tableCards.value.push({ player: 'me', card })
  currentTurn.value = 'bot'
  setTimeout(botPlay, 500)
}

// Bot joga aleatoriamente
const botPlay = () => {
  if (botHand.value.length === 0) return
  const idx = Math.floor(Math.random() * botHand.value.length)
  const card = botHand.value.splice(idx, 1)[0]
  tableCards.value.push({ player: 'bot', card })
  setTimeout(resolveRound, 500)
}

// Resolver quem ganhou a mão
const resolveRound = () => {
  if (tableCards.value.length < 2) return
  const [c1, c2] = tableCards.value
  const order = ['2','3','4','5','6','7','J','Q','K','A']
  let winner
  if (c2.card.naipe === trunfo.value.naipe) winner = 'bot'
  else if (c1.card.naipe === c2.card.naipe) winner = order.indexOf(c1.card.rank) > order.indexOf(c2.card.rank) ? 'me' : 'bot'
  else winner = 'me'
  score.value[winner] += 1
  tableCards.value = []
  currentTurn.value = 'player'
}

// Navegação tutorial
const next = async () => {
  if (step.value < tutorialSteps.length - 1) {
    step.value++
    highlightWinner.value = false
    await nextTick()
    setTimeout(() => (highlightWinner.value = true), 300)
  }
}

const prev = () => {
  if (step.value > 0) {
    step.value--
    highlightWinner.value = false
    setTimeout(() => (highlightWinner.value = true), 300)
  }
}

const finishTutorial = () => {
  localStorage.setItem('tutorialSeen', 'true')
  router.push('/')
}

const progress = () => Math.round(((step.value + 1) / tutorialSteps.length) * 100)
</script>

<template>
<div class="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
  <div class="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors">

    <!-- Progress bar -->
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
      <div class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" :style="{ width: progress() + '%' }" />
    </div>

    <!-- Step content -->
    <div class="text-center">
      <div class="text-5xl mb-4">{{ tutorialSteps[step].icon }}</div>
      <h1 class="text-3xl font-bold mb-4">{{ tutorialSteps[step].title }}</h1>
      <p class="text-lg opacity-80 mb-6">{{ tutorialSteps[step].text }}</p>

      <!-- Exemplo de jogada com animação -->
      <div v-if="tutorialSteps[step].example" class="flex justify-center gap-6 my-6">
        <Card
          v-for="(card, idx) in [tutorialSteps[step].example.player1, tutorialSteps[step].example.player2]"
          :key="idx"
          :card="{ rank: card.rank, naipe: card.naipe }"
          class="w-24 h-36 transition-transform duration-500"
          :style="highlightWinner && card === tutorialSteps[step].example['player' + tutorialSteps[step].example.winner] ? 'transform: scale(1.1); border: 2px solid green;' : ''"
        />
      </div>

      <!-- Mini-jogo interativo -->
      <div v-if="tutorialSteps[step].isInteractive" class="mt-6">
        <div class="flex justify-center gap-6 mb-4">
          <Card
            v-for="(move, idx) in tableCards"
            :key="move.card.id"
            :card="{ rank: move.card.rank, naipe: move.card.naipe }"
            class="w-24 h-36"
          />
        </div>

        <div class="flex justify-center gap-4 mb-4">
          <Card
            v-for="(card, index) in playerHand"
            :key="card.id"
            :card="{ rank: card.rank, naipe: card.naipe }"
            class="w-24 h-36 cursor-pointer"
            @click="playCard(index)"
          />
        </div>

        <div class="text-lg font-bold">
          Pontos - Tu: {{ score.me }} | Bot: {{ score.bot }}
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-between items-center gap-4 mt-8">
      <button @click="prev" :disabled="step === 0" class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-40 transition-colors">⬅ Anterior</button>

      <span class="text-sm opacity-60">Passo {{ step + 1 }} / {{ tutorialSteps.length }}</span>

      <button v-if="step < tutorialSteps.length - 1" @click="next" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Seguinte ➡</button>

      <button v-else @click="finishTutorial" class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">Começar a Jogar 🎮</button>
    </div>
  </div>
</div>
</template>
