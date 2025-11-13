<template>
  <div class="test-container">
    <h2>Test Card Images</h2>

    <!-- Test individual image -->
    <div class="image-test">
      <h3>Direct Image Test</h3>
      <img
        src="/assets/cards/cards1/c1.png"
        alt="Test Card"
        style="width: 96px; height: 128px; border: 2px solid #ccc; border-radius: 8px;"
        @load="onImageLoad"
        @error="onImageError"
      />
      <p>Status: {{ imageStatus }}</p>
    </div>

    <!-- Test CardComponent -->
    <div class="component-test">
      <h3>CardComponent Test</h3>
      <CardComponent
        :suit="'c'"
        :value="1"
        :visible="true"
      />
    </div>

    <!-- Test multiple cards -->
    <div class="multiple-test">
      <h3>Multiple Cards Test</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <CardComponent
          v-for="card in testCards"
          :key="`${card.suit}${card.value}`"
          :suit="card.suit"
          :value="card.value"
          :visible="true"
          size="small"
        />
      </div>
    </div>

    <!-- Test card backs -->
    <div class="backs-test">
      <h3>Card Backs Test</h3>
      <div style="display: flex; gap: 8px;">
        <CardComponent
          :suit="'c'"
          :value="1"
          :visible="false"
        />
        <CardComponent
          :suit="'e'"
          :value="2"
          :visible="false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CardComponent from './CardComponent.vue'

export default {
  name: 'TestCard',
  components: {
    CardComponent
  },
  data() {
    return {
      imageStatus: 'loading...',
      testCards: [
        { suit: 'c', value: 1 },
        { suit: 'e', value: 1 },
        { suit: 'o', value: 1 },
        { suit: 'p', value: 1 },
        { suit: 'c', value: 7 },
        { suit: 'e', value: 11 }
      ]
    }
  },
  methods: {
    onImageLoad() {
      this.imageStatus = '✅ Image loaded successfully!'
      console.log('Direct image loaded successfully')
    },
    onImageError(event) {
      this.imageStatus = '❌ Failed to load image'
      console.error('Failed to load image:', event.target.src)
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-container h2 {
  color: #333;
  margin-bottom: 20px;
}

.test-container h3 {
  color: #666;
  margin: 15px 0 10px 0;
  font-size: 1.1rem;
}

.image-test,
.component-test,
.multiple-test,
.backs-test {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.image-test p {
  margin-top: 10px;
  font-weight: bold;
}
</style>
