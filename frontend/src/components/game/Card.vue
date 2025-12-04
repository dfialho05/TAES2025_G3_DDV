<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: { type: Object, default: null },
  faceDown: { type: Boolean, default: false },
  interactable: { type: Boolean, default: false },
  deck: {type: String, default:'default'}
});

const cardImage = computed(() => {
  // 1. Carta virada para baixo
  if (props.faceDown || !props.card) {
    return new URL(`../../assets/cards/${props.deck}/semFace.png`, import.meta.url).href;
  }

  // 2. NAIPE: Usar DIRETAMENTE o que vem do servidor
  // O servidor envia 'c', 'o', 'p', 'e'.
  // As imagens chamam-se 'c...', 'o...', 'p...', 'e...'.
  // Não precisamos de mapa nem de fallback!
  const naipeCode = props.card.naipe;

  // 3. RANK: Traduzir letras (A, K, J, Q) para números das imagens
  const rankMap = {
    'A': '1',
    'J': '11',
    'Q': '12',
    'K': '13'
  };

  // Se for 'A' usa o mapa ('1'). Se for '7', usa o próprio '7'.
  const rankCode = rankMap[props.card.rank] || props.card.rank;

  // 4. Nome final (ex: c1.png, p13.png)
  const filename = `${naipeCode}${rankCode}.png`;

  return new URL(`../../assets/cards/${props.deck}/${filename}`, import.meta.url).href;
});
</script>

<template>
  <div
    class="card-wrapper"
    :class="{ 'interactable': interactable }"
  >
    <img :src="cardImage" alt="Carta" draggable="false" />
  </div>
</template>

<style scoped>
.card-wrapper {
  width: 70px;
  height: 100px;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  overflow: hidden;
  transition: transform 0.2s;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.interactable { cursor: pointer; }
.interactable:hover { transform: translateY(-15px); z-index: 10; }
</style>
