<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Demonstração das Cartas</h1>

        <!-- Controls -->
        <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div class="flex flex-wrap gap-4 items-center">
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        v-model="showHidden"
                        class="rounded"
                    />
                    <span>Mostrar cartas voltadas</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        v-model="makePlayable"
                        class="rounded"
                    />
                    <span>Cartas jogáveis</span>
                </label>
                <button
                    @click="resetDemo"
                    class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    Reset
                </button>
            </div>
        </div>

        <!-- Deck Demo -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold mb-4">Monte e Trunfo</h2>
            <div
                class="bg-green-700 dark:bg-green-900 rounded-lg p-8 flex items-center justify-center"
            >
                <Deck
                    :stack-size="deckSize"
                    :trump-card="trumpCard"
                    :show-trump="true"
                    :interactive="true"
                    @deck-clicked="handleDeckClick"
                    @card-drawn="handleCardDrawn"
                />
            </div>
        </div>

        <!-- All Cards Grid -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4">Todas as Cartas por Naipe</h2>

            <div class="space-y-8">
                <div
                    v-for="suit in suits"
                    :key="suit.code"
                    class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                    <h3
                        class="text-xl font-semibold mb-4 flex items-center gap-2"
                    >
                        <span>{{ suit.name }}</span>
                        <span class="text-2xl" :class="suit.color">{{
                            suit.symbol
                        }}</span>
                    </h3>
                    <div
                        class="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-10 gap-4"
                    >
                        <Card
                            v-for="value in cardValues"
                            :key="`${suit.code}-${value}`"
                            :suit="suit.code"
                            :value="value"
                            :hidden="showHidden && Math.random() > 0.7"
                            :playable="makePlayable"
                            :selected="
                                selectedCards.includes(`${suit.code}-${value}`)
                            "
                            @click="handleCardClick"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Selected Cards -->
        <div v-if="selectedCards.length > 0" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">
                Cartas Seleccionadas ({{ selectedCards.length }})
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div class="flex flex-wrap gap-4">
                    <div
                        v-for="cardId in selectedCards"
                        :key="cardId"
                        class="flex flex-col items-center gap-2"
                    >
                        <Card
                            :suit="cardId.split('-')[0]"
                            :value="parseInt(cardId.split('-')[1])"
                            :selected="true"
                            @click="removeCard"
                        />
                        <span class="text-xs text-gray-500">{{
                            getCardName(cardId)
                        }}</span>
                    </div>
                </div>
                <button
                    @click="clearSelection"
                    class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Limpar Seleção
                </button>
            </div>
        </div>

        <!-- Game Statistics -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 class="text-2xl font-bold mb-4">Estatísticas</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                    <p class="text-3xl font-bold text-primary-600">
                        {{ totalCards }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Total de Cartas
                    </p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-green-600">
                        {{ selectedCards.length }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Selecionadas
                    </p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-blue-600">
                        {{ deckSize }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        No Monte
                    </p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-purple-600">
                        {{ suits.length }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Naipes
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Card from "../components/Card.vue";
import Deck from "../components/Deck.vue";

// Reactive data
const showHidden = ref(false);
const makePlayable = ref(true);
const selectedCards = ref([]);
const deckSize = ref(28);
const trumpCard = ref({ suit: "c", value: 1 }); // Ace of Hearts

// Constants
const suits = [
    { code: "c", name: "Copas", symbol: "♥", color: "text-red-600" },
    {
        code: "e",
        name: "Espadas",
        symbol: "♠",
        color: "text-gray-900 dark:text-white",
    },
    { code: "o", name: "Ouros", symbol: "♦", color: "text-red-600" },
    {
        code: "p",
        name: "Paus",
        symbol: "♣",
        color: "text-gray-900 dark:text-white",
    },
];

const cardValues = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

// Computed
const totalCards = computed(() => suits.length * cardValues.length);

// Methods
const handleCardClick = (card) => {
    const cardId = `${card.suit}-${card.value}`;
    const index = selectedCards.value.indexOf(cardId);

    if (index > -1) {
        selectedCards.value.splice(index, 1);
    } else {
        selectedCards.value.push(cardId);
    }
};

const removeCard = (card) => {
    const cardId = `${card.suit}-${card.value}`;
    const index = selectedCards.value.indexOf(cardId);
    if (index > -1) {
        selectedCards.value.splice(index, 1);
    }
};

const clearSelection = () => {
    selectedCards.value = [];
};

const resetDemo = () => {
    selectedCards.value = [];
    showHidden.value = false;
    makePlayable.value = true;
    deckSize.value = 28;
    trumpCard.value = { suit: "c", value: 1 };
};

const handleDeckClick = () => {
    // Deck clicked
};

const handleCardDrawn = (remainingCards) => {
    deckSize.value = remainingCards;
};

const getCardName = (cardId) => {
    const [suitCode, value] = cardId.split("-");
    const suit = suits.find((s) => s.code === suitCode);

    const valueNames = {
        1: "Ás",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
        7: "7",
        11: "Valete",
        12: "Dama",
        13: "Rei",
    };

    return `${valueNames[value]} de ${suit?.name}`;
};
</script>

<style scoped>
/* Additional styles for the demo */
.grid {
    display: grid;
}

.grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (min-width: 640px) {
    .sm\:grid-cols-7 {
        grid-template-columns: repeat(7, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .lg\:grid-cols-10 {
        grid-template-columns: repeat(10, minmax(0, 1fr));
    }
}
</style>
