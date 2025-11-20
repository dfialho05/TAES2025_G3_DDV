<script setup>
    import { ref, reactive } from 'vue'

    const hello = ref('Hello World')
    let counter = reactive({value:0})

    const increase = () => {
        counter.value++
    }
    const decrease = () => {
        counter.value--
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
