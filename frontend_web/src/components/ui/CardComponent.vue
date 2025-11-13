<template>
  <div
    :class="[
      'card-container',
      {
        'cursor-pointer': clickable,
        'card-back': !visible,
      },
    ]"
    :style="containerStyle"
    @click="handleClick"
  >
    <img
      v-if="visible && !imageError"
      :src="cardImage"
      :alt="`${cardValue} de ${suitName}`"
      class="card-image"
      @error="handleImageError"
    />
    <div v-else-if="visible && imageError" class="fallback-card">
      <div class="card-content">
        <div class="card-value">{{ getDisplayValue() }}</div>
        <div class="card-suit" :style="{ color: getSuitColor() }">{{ getSuitSymbol() }}</div>
      </div>
    </div>
    <img
      v-else-if="!visible && !backImageError"
      :src="backCardImage"
      alt="Carta virada para baixo"
      class="card-image"
      @error="handleBackImageError"
    />
    <div v-else class="card-back-fallback">
      <div class="back-pattern">🂠</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  suit: {
    type: String,
    required: true,
    validator: (value) => ['c', 'e', 'o', 'p'].includes(value),
  },
  value: {
    type: [String, Number],
    required: true,
    validator: (value) => {
      const validValues = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13]
      return validValues.includes(Number(value))
    },
  },
  visible: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value),
  },
})

const emit = defineEmits(['click'])

const imageError = ref(false)
const backImageError = ref(false)

const containerStyle = computed(() => {
  const sizes = {
    small: { width: '48px', height: '64px' },
    normal: { width: '96px', height: '128px' },
    large: { width: '128px', height: '176px' },
  }

  return {
    ...sizes[props.size],
    backgroundColor: props.visible ? 'white' : '#1e3a8a',
    border: props.visible ? '2px solid #d1d5db' : '2px solid #1d4ed8',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  }
})

const cardImage = computed(() => {
  if (imageError.value) return null
  const suitLetter = props.suit.toLowerCase()
  const cardValue = props.value
  return `/assets/cards/cards1/${suitLetter}${cardValue}.png`
})

const backCardImage = computed(() => {
  return '/assets/cards/cards1/semFace.png'
})

const suitName = computed(() => {
  const suitNames = {
    c: 'Copas',
    e: 'Espadas',
    o: 'Ouros',
    p: 'Paus',
  }
  return suitNames[props.suit] || 'Desconhecido'
})

const cardValue = computed(() => {
  const valueNames = {
    1: 'Ás',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    11: 'Valete',
    12: 'Dama',
    13: 'Rei',
  }
  return valueNames[Number(props.value)] || props.value
})

function handleClick() {
  if (props.clickable) {
    emit('click', { suit: props.suit, value: props.value })
  }
}

function handleImageError() {
  console.warn(`Failed to load card image: ${cardImage.value}`)
  imageError.value = true
}

function handleBackImageError() {
  console.warn('Failed to load card back image')
  backImageError.value = true
}

function getDisplayValue() {
  const valueMap = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K',
  }
  return valueMap[Number(props.value)] || props.value
}

function getSuitSymbol() {
  const suitMap = {
    c: '♥',
    e: '♠',
    o: '♦',
    p: '♣',
  }
  return suitMap[props.suit] || '?'
}

function getSuitColor() {
  return ['c', 'o'].includes(props.suit) ? '#dc2626' : '#374151'
}
</script>

<style scoped>
.card-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-container.cursor-pointer {
  cursor: pointer;
}

.card-container.cursor-pointer:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-card {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  text-align: center;
}

.card-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.card-suit {
  font-size: 1.5rem;
  line-height: 1;
  margin-top: 4px;
}

.card-back-fallback {
  width: 100%;
  height: 100%;
  background: #1e3a8a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-pattern {
  color: white;
  font-size: 2rem;
}

/* Size adjustments for small cards */
.card-container[style*='width: 48px'] .card-value {
  font-size: 1rem;
}

.card-container[style*='width: 48px'] .card-suit {
  font-size: 0.75rem;
}

.card-container[style*='width: 48px'] .back-pattern {
  font-size: 1rem;
}

/* Size adjustments for large cards */
.card-container[style*='width: 128px'] .card-value {
  font-size: 3rem;
}

.card-container[style*='width: 128px'] .card-suit {
  font-size: 2rem;
}

.card-container[style*='width: 128px'] .back-pattern {
  font-size: 3rem;
}
</style>
