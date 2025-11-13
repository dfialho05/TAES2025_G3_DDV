<template>
    <div
        :class="[
            'card-container',
            {
                'card-playable': playable,
                'card-selected': selected,
                'card-disabled': disabled,
            },
        ]"
        @click="handleClick"
    >
        <div class="card-face" v-if="!hidden">
            <img
                :src="cardImage"
                :alt="`${value} de ${suitName}`"
                class="card-image"
            />
        </div>
        <div class="card-back" v-else>
            <img :src="backImage" alt="Carta voltada" class="card-image" />
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useCardsStore } from "../stores/cards.js";

const props = defineProps({
    suit: {
        type: String,
        required: true,
        validator: (value) => ["c", "e", "o", "p"].includes(value),
    },
    value: {
        type: [String, Number],
        required: true,
        validator: (value) => {
            const validValues = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];
            return validValues.includes(Number(value));
        },
    },
    hidden: {
        type: Boolean,
        default: false,
    },
    playable: {
        type: Boolean,
        default: false,
    },
    selected: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["click", "card-played"]);

const cardsStore = useCardsStore();

const suitName = computed(() => {
    return cardsStore.getSuitName(props.suit);
});

const cardImage = computed(() => {
    return (
        cardsStore.getCardImage(props.suit, props.value) ||
        cardsStore.getCardBackImage()
    );
});

const backImage = computed(() => {
    return cardsStore.getCardBackImage();
});

const handleClick = () => {
    if (!props.disabled && props.playable) {
        emit("click", { suit: props.suit, value: props.value });
        emit("card-played", { suit: props.suit, value: props.value });
    }
};
</script>

<style scoped>
.card-container {
    @apply w-20 h-28 rounded-lg shadow-lg transition-all duration-200 cursor-pointer;
    perspective: 1000px;
}

.card-face,
.card-back {
    @apply w-full h-full rounded-lg overflow-hidden bg-white;
    backface-visibility: hidden;
}

.card-image {
    @apply w-full h-full object-contain rounded-lg;
    background: white;
}

.card-playable {
    @apply hover:-translate-y-2 hover:shadow-xl;
}

.card-playable:hover {
    @apply scale-105;
}

.card-selected {
    @apply -translate-y-2 ring-2 ring-primary-500 ring-offset-2;
}

.card-disabled {
    @apply opacity-50 cursor-not-allowed;
}

.card-disabled:hover {
    @apply transform-none shadow-lg;
}

/* Responsive card sizing */
@media (max-width: 640px) {
    .card-container {
        @apply w-16 h-24;
    }
}

@media (min-width: 1024px) {
    .card-container {
        @apply w-24 h-32;
    }
}
</style>
