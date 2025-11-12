<template>
    <div class="card w-[80px] h-[120px] rounded-lg shadow-lg overflow-hidden">
        <img :src="cardImage" class="w-full h-full object-cover" alt="Carta" />
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    card: {
        type: Object,
        required: true,
    },
});

const cardImage = computed(() => {
    // se a carta estiver virada para baixo
    if (!props.card.flipped) {
        return new URL(`../assets/cards/back.png`, import.meta.url).href;
    }

    // carta virada para cima
    try {
        return new URL(`../assets/cards/${props.card.face}.png`, import.meta.url).href;
    } catch (err) {
        console.warn("⚠️ Imagem não encontrada:", props.card.face);
        return new URL(`../assets/cards/back.png`, import.meta.url).href;
    }
});
</script>

<style scoped>
.card {
    transition: transform 0.3s;
}

.card:hover {
    transform: scale(1.05);
}
</style>
