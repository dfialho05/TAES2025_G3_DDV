<template>
    <div class="deck-container">
        <!-- Deck Stack -->
        <div class="deck-stack" @click="handleDeckClick">
            <div
                v-for="n in Math.min(stackSize, 5)"
                :key="n"
                class="deck-card"
                :style="{ transform: `translate(${(n - 1) * 2}px, ${(n - 1) * -2}px)` }"
            >
                <img
                    :src="backImage"
                    alt="Carta do baralho"
                    class="card-image"
                />
            </div>
            <div v-if="stackSize === 0" class="empty-deck">
                <div class="empty-deck-placeholder">
                    Baralho Vazio
                </div>
            </div>
        </div>

        <!-- Cards Count -->
        <div class="deck-info">
            <span class="cards-count">{{ stackSize }} cartas</span>
        </div>

        <!-- Trump Card (if visible) -->
        <div v-if="trumpCard && showTrump" class="trump-container">
            <Card
                :suit="trumpCard.suit"
                :value="trumpCard.value"
                class="trump-card"
            />
            <div class="trump-label">
                <span class="trump-text">Trunfo</span>
                <span class="trump-suit">{{ trumpSuitSymbol }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import Card from "./Card.vue";

const props = defineProps({
    stackSize: {
        type: Number,
        default: 40,
        validator: (value) => value >= 0 && value <= 40,
    },
    trumpCard: {
        type: Object,
        default: null,
        validator: (value) => {
            if (!value) return true;
            return (
                value.suit &&
                ["c", "e", "o", "p"].includes(value.suit) &&
                value.value &&
                [1, 2, 3, 4, 5, 6, 7, 11, 12, 13].includes(Number(value.value))
            );
        },
    },
    showTrump: {
        type: Boolean,
        default: true,
    },
    interactive: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["deck-clicked", "card-drawn"]);

const backImage = computed(() => {
    return "/src/assets/cards1/semFace.png";
});

const trumpSuitSymbol = computed(() => {
    if (!props.trumpCard) return "";
    const symbols = {
        c: "♥", // Copas
        e: "♠", // Espadas
        o: "♦", // Ouros
        p: "♣", // Paus
    };
    return symbols[props.trumpCard.suit] || "";
});

const handleDeckClick = () => {
    if (props.interactive && props.stackSize > 0) {
        emit("deck-clicked");
        emit("card-drawn", props.stackSize - 1);
    }
};
</script>

<style scoped>
.deck-container {
    @apply flex items-center gap-4 relative;
}

.deck-stack {
    @apply relative cursor-pointer;
    width: 80px;
    height: 112px;
}

.deck-card {
    @apply absolute top-0 left-0 w-20 h-28 rounded-lg shadow-lg;
    transition: transform 0.2s ease;
}

.deck-stack:hover .deck-card {
    transform: translate(2px, -4px) !important;
}

.card-image {
    @apply w-full h-full object-cover rounded-lg;
}

.empty-deck {
    @apply w-20 h-28 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center;
}

.empty-deck-placeholder {
    @apply text-xs text-gray-500 text-center p-2;
}

.deck-info {
    @apply flex flex-col items-center gap-1;
}

.cards-count {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.trump-container {
    @apply relative;
}

.trump-card {
    @apply transform rotate-90;
    margin-left: -20px;
}

.trump-label {
    @apply absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center;
}

.trump-text {
    @apply block text-xs text-gray-600 dark:text-gray-400;
}

.trump-suit {
    @apply block text-lg font-bold;
}

/* Trump suit colors */
.trump-suit {
    @apply text-red-600;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .deck-stack {
        width: 64px;
        height: 96px;
    }

    .deck-card {
        @apply w-16 h-24;
    }

    .empty-deck {
        @apply w-16 h-24;
    }

    .trump-card {
        margin-left: -16px;
    }
}

@media (min-width: 1024px) {
    .deck-stack {
        width: 96px;
        height: 128px;
    }

    .deck-card {
        @apply w-24 h-32;
    }

    .empty-deck {
        @apply w-24 h-32;
    }

    .trump-card {
        margin-left: -24px;
    }
}

/* Animation for card drawing */
.deck-card-leave-active {
    transition: all 0.3s ease;
}

.deck-card-leave-to {
    opacity: 0;
    transform: translateY(-50px) rotate(10deg);
}
</style>
