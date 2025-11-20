<script setup>
import { inject } from 'vue'
const serverBaseURL = inject("serverBaseURL")

const props = defineProps({
    card: {
        type: Object,
        required: true
    }
})

const emits = defineEmits(['clicked'])

const handleClick = () => {
    if (!props.card.isMatched && !props.card.isFlipped) {
        emits('clicked', props.card)
    }

}
</script>

<template>
    <div class="relative w-30 h-40 leading-40 cursor-pointer
                border-2 border-slate-600 text-2xl text-center" :class="{ 'cursor-not-allowed': card.matched }"
        @click="handleClick">
        <div v-if="!card.flipped" class=" bg-purple-600   hover:bg-violet-400">
            <span class="text-3xl text-white font-bold">?</span>
        </div>
        <div v-else-if="card.imageUrl">
          <img :src="`${serverBaseURL}${card.imageUrl}`" class="w-full h-full object-cover" />
        </div>
        <div v-else>
          {{ card.face }}
        </div>


    </div>
</template>


