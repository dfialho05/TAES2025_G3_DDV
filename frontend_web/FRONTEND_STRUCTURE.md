# Frontend Structure Documentation

## 📁 Estrutura de Pastas

```
frontend_web/
├── src/
│   ├── components/
│   │   ├── ui/                     # Componentes de UI reutilizáveis
│   │   │   ├── BiscaCard.vue      # Componente principal das cartas
│   │   │   └── ...
│   │   └── game/                   # Componentes específicos do jogo
│   │       ├── GameHeader.vue     # Cabeçalho do jogo
│   │       ├── GameCenter.vue     # Área central (deck, trunfo, cartas jogadas)
│   │       └── DebugControls.vue  # Controles de debug
│   ├── composables/
│   │   └── useResponsive.js       # Composable para responsividade
│   ├── constants/
│   │   ├── cardConstants.js       # Constantes das cartas
│   │   └── gameConstants.js       # Constantes do jogo
│   ├── stores/
│   │   └── game/
│   │       └── gameStore.js       # Store principal do jogo (Pinia)
│   ├── utils/
│   │   ├── cardUtils.js           # Utilidades das cartas
│   │   ├── gameLogic.js           # Lógica principal do jogo
│   │   └── responsiveUtils.js     # Utilidades de responsividade
│   └── views/
│       └── Game.vue               # Vista principal do jogo
```

## 🎯 Arquitetura

### 1. **Separação de Responsabilidades**

#### **Constants (Constantes)**
- `cardConstants.js`: Naipes, valores, símbolos, pontos das cartas
- `gameConstants.js`: Estados do jogo, configurações, breakpoints

#### **Utils (Utilidades)**
- `cardUtils.js`: Manipulação, validação e operações com cartas
- `gameLogic.js`: Regras do jogo, IA do bot, validação de jogadas
- `responsiveUtils.js`: Lógica de responsividade e adaptação de layout

#### **Stores (Estado Global)**
- `gameStore.js`: Estado central do jogo usando Pinia
  - Estado das cartas, pontuações, jogador atual
  - Ações do jogo (jogar carta, reiniciar, etc.)
  - Funcionalidades de debug

#### **Composables (Lógica Reutilizável)**
- `useResponsive.js`: Hook para gerenciar responsividade
  - Detecta tipo de dispositivo
  - Calcula tamanhos de cartas apropriados
  - Observa mudanças na viewport

#### **Components (Componentes)**
- **UI Components**: Componentes reutilizáveis (`BiscaCard.vue`)
- **Game Components**: Componentes específicos do jogo
  - `GameHeader.vue`: Cabeçalho com pontuação e controles
  - `GameCenter.vue`: Área central do jogo
  - `DebugControls.vue`: Controles de desenvolvimento

## 🎴 Componente BiscaCard

### **Características**
- 5 tamanhos responsivos: `xsmall`, `small`, `normal`, `large`, `xlarge`
- Suporte a imagem real das cartas (`semFace.png` para verso)
- Fallback para texto quando imagem falha
- Estados: visível/oculto, clicável/não-clicável
- Animações suaves e efeitos hover

### **Props**
```javascript
{
  suit: String,      // 'c', 'e', 'o', 'p'
  value: Number,     // 1-13
  visible: Boolean,  // Mostra face ou verso
  clickable: Boolean,
  size: String       // Tamanho da carta
}
```

## 🎮 Game Store (Pinia)

### **Estado Central**
```javascript
{
  gameState: {
    playerHand: Card[],
    opponentHand: Card[],
    deck: Card[],
    trumpCard: Card,
    playedCards: { player: Card, opponent: Card },
    scores: { player: Number, opponent: Number },
    currentPlayer: String,
    currentState: String
  },
  selectedCardIndex: Number,
  isLoading: Boolean,
  error: String
}
```

### **Ações Principais**
- `startNewGame()`: Inicia novo jogo
- `selectCard(index)`: Seleciona carta do jogador
- `playCard(card, index)`: Joga uma carta
- `restartGame()`: Reinicia o jogo
- `togglePause()`: Pausa/resume o jogo

### **Ações de Debug**
- `setTestCardCount(count)`: Define número de cartas para teste
- `addTestCards(count)`: Adiciona cartas de teste
- `setScores(scores)`: Define pontuação manualmente
- `forceGameEnd()`: Força fim do jogo

## 📱 Sistema de Responsividade

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Tamanhos de Cartas Adaptativos**
```javascript
// Jogador
Mobile:   3 cartas → large,  4-5 → normal, 6-7 → small, 8-9 → xsmall
Desktop:  3 cartas → xlarge, 4-5 → large,  6 → normal,  7-8 → small, 9 → xsmall

// Oponente
Mobile:   3 cartas → normal, 4-6 → small, 7+ → xsmall
Desktop:  3 cartas → large,  4-5 → normal, 6-7 → small, 8+ → xsmall

// Centro
Mobile:   large
Desktop:  xlarge
```

### **Layout Responsivo**
- **Mobile**: Layout vertical (deck/trunfo → cartas jogadas → score)
- **Desktop**: Layout horizontal (3 colunas)
- **Gaps dinâmicos**: Ajustam baseado no número de cartas
- **Orientação landscape**: Otimizada para telas horizontais

## 🎯 Lógica do Jogo

### **Regras da Bisca**
- Implementadas em `gameLogic.js`
- Prioridade de cartas: Ás > 7 > Rei > Dama > Valete > outros
- Trunfo sempre vence carta comum
- Primeiro a jogar vence se empate

### **IA do Bot**
- Estratégia simples mas eficaz
- Tenta vencer cartas valiosas (4+ pontos)
- Joga cartas baixas quando não pode vencer
- Tempo de "pensamento" simulado (1.5s)

## 🔧 Funcionalidades de Debug

### **Controles Disponíveis**
- Definir número de cartas (3, 6, 9)
- Reiniciar jogo / Reset pontuação
- Adicionar/remover cartas da mão
- Forçar fim de jogo
- Visualizar estado interno

### **Informações de Debug**
- Estado atual do jogo
- Jogador atual
- Carta selecionada
- Tamanho das mãos
- Pontuações

## 🚀 Como Usar

### **Inicialização**
```javascript
// No componente Game.vue
import { useGameStore } from '../stores/game/gameStore.js'
import { useResponsive } from '../composables/useResponsive.js'

const gameStore = useGameStore()
const responsive = useResponsive()

// Iniciar jogo
await gameStore.startNewGame({ cardsPerPlayer: 3 })
```

### **Jogabilidade**
1. **Seleção**: Clique na carta para selecioná-la
2. **Jogada**: Clique novamente para jogar
3. **Responsividade**: Automática baseada no dispositivo
4. **Estados**: Feedback visual para todas as ações

## 📊 Vantagens da Nova Estrutura

### **Escalabilidade**
- Componentes modulares e reutilizáveis
- Estado centralizado e organizado
- Lógica separada da apresentação

### **Manutenibilidade**
- Código bem documentado com JSDoc
- Separação clara de responsabilidades
- Fácil localização de funcionalidades

### **Testabilidade**
- Funções puras em utils
- Estado previsível no store
- Componentes isolados

### **Performance**
- Computed properties otimizadas
- Responsividade eficiente
- Animações suaves

### **Developer Experience**
- Controles de debug integrados
- TypeScript-ready (com JSDoc)
- Hot reload otimizado
- Estrutura intuitiva

## 🎨 Melhorias Visuais

### **Design System**
- Paleta de cores consistente
- Sombras e elevações padronizadas
- Transições suaves (0.3s cubic-bezier)
- Feedback visual claro

### **Animações**
- Seleção de cartas com elevação
- Hover effects responsivos
- Loading states
- Transições de estado

### **Acessibilidade**
- Alt texts descritivos
- Cores contrastantes
- Feedback tátil (mobile)
- Estados visuais claros

---

Esta estrutura torna o frontend muito mais organizado, escalável e fácil de manter, seguindo as melhores práticas de desenvolvimento Vue.js moderno.