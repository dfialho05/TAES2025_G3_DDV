<script>
import { ref, reactive } from 'vue'
export default {
  setup() {

    const hello = ref('Hello World')
    let counter = reactive({value:0})

    const increase = () => {
        counter.value++
    }
    const decrease = () => {
        counter.value--
    }

    return {
      hello,
      counter,
        increase,
        decrease,
    }
  }
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
