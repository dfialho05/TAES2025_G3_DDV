<script setup>
import MemoryCard from './MemoryCard.vue';

const props = defineProps({
    cards: {
        type: Array,
        required: true
    }
})

const emits = defineEmits(['flipCard'])

const handleCardClick = (card) => {
  emits('flipCard', card)
}
</script>


<template>
    <div class="m-auto pt-10 grid gap-10 p-4 max-w-lg grid-cols-4">
        <MemoryCard
        @clicked="handleCardClick"
        v-for="item in cards"
        :card="item"
        :key="item.id"/>
    </div>
</template>


