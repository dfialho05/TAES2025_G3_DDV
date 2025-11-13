<template>
  <div
    class="bisca-card"
    :class="[{ clickable: clickable, back: !visible }, `card-${size}`]"
    @click="handleClick"
  >
    <img
      v-if="visible && !imageError"
      :src="cardImageUrl"
      :alt="`${displayValue} de ${suitName}`"
      class="card-img"
      @error="onImageError"
    />
    <div v-else-if="visible && imageError" class="fallback-face">
      <div class="card-text">
        <div class="value">{{ displayValue }}</div>
        <div
          class="suit"
          :class="{ red: ['c', 'o'].includes(suit), black: ['e', 'p'].includes(suit) }"
        >
          {{ suitSymbol }}
        </div>
      </div>
    </div>
    <div v-else class="card-back">
      <img
        src="/assets/cards/cards1/semFace.png"
        alt="Verso da carta"
        class="card-back-img"
        @error="onBackImageError"
      />
      <div v-if="backImageError" class="back-design"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BiscaCard',
  props: {
    suit: {
      type: String,
      required: true,
      validator: (value) => ['c', 'e', 'o', 'p'].includes(value),
    },
    value: {
      type: [String, Number],
      required: true,
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
      validator: (value) => ['xsmall', 'small', 'normal', 'large', 'xlarge'].includes(value),
    },
  },
  data() {
    return {
      imageError: false,
      backImageError: false,
    }
  },
  computed: {
    cardImageUrl() {
      return `/assets/cards/cards1/${this.suit}${this.value}.png`
    },
    displayValue() {
      const valueMap = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K',
      }
      return valueMap[Number(this.value)] || this.value
    },
    suitSymbol() {
      const suitMap = {
        c: '♥',
        e: '♠',
        o: '♦',
        p: '♣',
      }
      return suitMap[this.suit] || '?'
    },
    suitName() {
      const suitNames = {
        c: 'Copas',
        e: 'Espadas',
        o: 'Ouros',
        p: 'Paus',
      }
      return suitNames[this.suit] || 'Desconhecido'
    },
    suitColor() {
      return ['c', 'o'].includes(this.suit) ? '#dc2626' : '#374151'
    },
  },
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit('click', { suit: this.suit, value: this.value })
      }
    },
    onImageError() {
      this.imageError = true
      console.warn(`Failed to load card image: ${this.cardImageUrl}`)
    },
    onBackImageError() {
      this.backImageError = true
      console.warn('Failed to load card back image: semFace.png')
    },
  },
}
</script>

<style scoped>
/* Component-specific styles - most styles are now in index.css */
.card-text .suit.red {
  color: #dc2626;
}
.card-text .suit.black {
  color: #374151;
}
</style>
