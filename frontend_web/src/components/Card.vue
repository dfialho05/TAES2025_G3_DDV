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
                @error="handleImageError"
                @load="handleImageLoad"
            />
        </div>
        <div class="card-back" v-else>
            <img :src="backImage" alt="Carta virada" class="card-image" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import {
    getCardImage,
    cardBackImage,
    hasCardImage,
} from "../assets/cardImages.js";

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

const suitName = computed(() => {
    const suitNames = {
        c: "Copas",
        e: "Espadas",
        o: "Ouros",
        p: "Paus",
    };
    return suitNames[props.suit] || "Desconhecido";
});

const cardImage = computed(() => {
    // Try to get PNG image first
    const pngImage = getCardImage(props.suit, props.value);
    console.log(`Card ${props.suit}${props.value} image:`, pngImage);

    // Check if we have a valid image URL
    if (pngImage && typeof pngImage === "string" && pngImage.length > 0) {
        console.log(`Using PNG image for ${props.suit}${props.value}`);
        return pngImage;
    }

    // Fallback to generated SVG
    console.log(`Fallback to SVG for ${props.suit}${props.value}`);
    return generateCardSVG();
});

const backImage = computed(() => {
    return cardBackImage;
});

const generateCardSVG = () => {
    const suitSymbols = {
        c: "♥", // Copas (Hearts)
        e: "♠", // Espadas (Spades)
        o: "♦", // Ouros (Diamonds)
        p: "♣", // Paus (Clubs)
    };

    const suitColors = {
        c: "#dc2626", // red
        e: "#000000", // black
        o: "#dc2626", // red
        p: "#000000", // black
    };

    const valueDisplay =
        props.value === 1
            ? "A"
            : props.value === 11
              ? "J"
              : props.value === 12
                ? "Q"
                : props.value === 13
                  ? "K"
                  : props.value.toString();

    const svg = `
        <svg width="80" height="112" viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="112" rx="8" fill="white" stroke="#ccc" stroke-width="1"/>
            <text x="12" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${suitColors[props.suit]}">${valueDisplay}</text>
            <text x="12" y="35" font-family="Arial, sans-serif" font-size="16" fill="${suitColors[props.suit]}">${suitSymbols[props.suit]}</text>
            <text x="40" y="65" font-family="Arial, sans-serif" font-size="24" fill="${suitColors[props.suit]}" text-anchor="middle">${suitSymbols[props.suit]}</text>
            <g transform="rotate(180 68 92)">
                <text x="68" y="92" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${suitColors[props.suit]}">${valueDisplay}</text>
                <text x="68" y="107" font-family="Arial, sans-serif" font-size="16" fill="${suitColors[props.suit]}">${suitSymbols[props.suit]}</text>
            </g>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const generateBackSVGDataUrl = () => {
    const svg = `
        <svg width="80" height="112" viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="cardBack" patternUnits="userSpaceOnUse" width="8" height="8">
                    <rect width="8" height="8" fill="#1e40af"/>
                    <path d="M0,8 l8,-8 M-2,2 l4,-4 M6,10 l4,-4" stroke="#3b82f6" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="80" height="112" rx="8" fill="url(#cardBack)" stroke="#1e40af" stroke-width="2"/>
            <rect x="8" y="8" width="64" height="96" rx="4" fill="none" stroke="#60a5fa" stroke-width="1"/>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const handleClick = () => {
    if (!props.disabled && props.playable) {
        emit("click", { suit: props.suit, value: props.value });
        emit("card-played", { suit: props.suit, value: props.value });
    }
};

const handleImageLoad = (event) => {
    console.log(`Successfully loaded card image: ${props.suit}${props.value}`);
};

const handleImageError = (event) => {
    console.log(
        `Failed to load card image: ${props.suit}${props.value}, using SVG fallback`,
    );
    console.log(`Original src was:`, event.target.src);
    // Replace with SVG fallback
    event.target.src = generateCardSVG();
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
