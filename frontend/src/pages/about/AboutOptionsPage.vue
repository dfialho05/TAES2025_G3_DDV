<script>
export default {
  data() {
    return {
      hello: 'Hello World',
      counter: 0,
    }
  },
  methods: {
    increase() {
      this.counter++
    },
    decrease() {
      this.counter--
    },
  },
}
</script>

<template>
  <div>
    <h1>{{ hello }}</h1>
    <p>Counter: {{ counter }}</p>
    <button v-on:click="increase">+</button>
    <button @click="decrease">-</button>
  </div>
</template>

