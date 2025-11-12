<script setup>
import { ref } from 'vue'
import MemoryCard from './MemoryCard.vue';
const emits = defineEmits(['cardClicked'])
const props = defineProps(['cards'])
const handleClick = (card) => {
    console.log('Card clicked:', card)
    emits('cardClicked', card)
}
</script>


<template>
    <div class="m-auto pt-10 grid gap-10 p-4 max-w-lg grid-cols-4">
        <MemoryCard v-for="item in props.cards" :card="item" :key="item.id" @clicked="handleClick"/>
    </div>
</template>
