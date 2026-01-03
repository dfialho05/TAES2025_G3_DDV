# Guia de Uso - Sistema de Recuperação de Estado

## Introdução

Este guia fornece exemplos práticos de como utilizar o sistema de recuperação de estado implementado no frontend da aplicação Bisca Game.

## Para Desenvolvedores Frontend

### 1. Usar o Sistema em Novos Componentes

#### 1.1 Importar as Stores Necessárias

```javascript
import { useBiscaStore } from '@/stores/biscaStore'
import { useSocketStore } from '@/stores/socket'

const biscaStore = useBiscaStore()
const socketStore = useSocketStore()
```

#### 1.2 Aceder ao Estado de Recuperação

```javascript
import { storeToRefs } from 'pinia'

const { isRecovering, connectionLost, gameID } = storeToRefs(biscaStore)
const { isConnected, isReconnecting } = storeToRefs(socketStore)
```

#### 1.3 Mostrar Feedback Visual

```vue
<template>
  <div v-if="isRecovering" class="recovery-banner">
    A recuperar o seu jogo...
  </div>

  <div v-if="connectionLost" class="warning-banner">
    Conexão perdida. A tentar reconectar...
  </div>

  <div v-if="!isConnected" class="error-banner">
    Desconectado do servidor
  </div>
</template>
```

### 2. Usar o Composable de Recuperação

#### 2.1 Importar e Configurar

```javascript
import { useGameRecovery } from '@/composables/useGameRecovery'

const { 
  attemptRecovery, 
  setupRecoveryWatchers, 
  handlePageReload 
} = useGameRecovery()
```

#### 2.2 Configurar no onMounted

```javascript
onMounted(async () => {
  setupRecoveryWatchers()
  
  const recovered = await handlePageReload()
  if (recovered) {
    console.log('Jogo recuperado com sucesso')
  }
})
```

#### 2.3 Tentar Recuperação Manual

```javascript
const handleManualRecovery = async () => {
  const success = await attemptRecovery()
  
  if (success) {
    toast.success('Jogo recuperado!')
  } else {
    toast.error('Não foi possível recuperar o jogo')
  }
}
```

### 3. Tratar Eventos de Anulação

#### 3.1 Usar o Modal de Anulação

```vue
<template>
  <GameAnnulledModal
    :show="showAnnulledModal"
    :message="annulledMessage"
    :reason="annulledReason"
    @close="handleModalClose"
  />
</template>

<script setup>
import GameAnnulledModal from '@/components/game/GameAnnulledModal.vue'
import { storeToRefs } from 'pinia'
import { useBiscaStore } from '@/stores/biscaStore'

const biscaStore = useBiscaStore()
const { showAnnulledModal, annulledMessage, annulledReason } = storeToRefs(biscaStore)

const handleModalClose = () => {
  biscaStore.closeAnnulledModal()
  router.push('/games/lobby')
}
</script>
```

#### 3.2 Escutar Evento Customizado

```javascript
import { onMounted, onUnmounted } from 'vue'

const handleGameAnnulled = (data) => {
  console.log('Jogo anulado:', data.reason)
  
  if (data.refunded) {
    toast.info('As suas moedas foram devolvidas')
  }
}

onMounted(() => {
  if (socketStore.socket) {
    socketStore.socket.on('game_annulled', handleGameAnnulled)
  }
})

onUnmounted(() => {
  if (socketStore.socket) {
    socketStore.socket.off('game_annulled', handleGameAnnulled)
  }
})
```

### 4. Trabalhar com Estado Persistido

#### 4.1 Carregar Estado Manualmente

```javascript
const checkForSavedGame = () => {
  const state = biscaStore.loadPersistedState()
  
  if (state) {
    console.log('Jogo guardado encontrado:', state.gameID)
    return state
  }
  
  return null
}
```

#### 4.2 Limpar Estado Manualmente

```javascript
const clearSavedGame = () => {
  biscaStore.resetGameState()
  toast.success('Estado de jogo limpo')
}
```

### 5. Monitorizar Estado da Conexão

#### 5.1 Watcher de Conexão

```javascript
import { watch } from 'vue'

watch(
  () => socketStore.isConnected,
  (connected) => {
    if (connected) {
      console.log('Conectado ao servidor')
    } else {
      console.log('Desconectado do servidor')
    }
  }
)
```

#### 5.2 Watcher de Recuperação

```javascript
watch(
  () => biscaStore.isRecovering,
  (recovering) => {
    if (recovering) {
      showLoadingOverlay.value = true
    } else {
      showLoadingOverlay.value = false
    }
  }
)
```

### 6. Integrar ConnectionStatus em Páginas

```vue
<template>
  <div>
    <ConnectionStatus />
    
    <YourPageContent />
  </div>
</template>

<script setup>
import ConnectionStatus from '@/components/game/ConnectionStatus.vue'
</script>
```

## Para Testers

### Cenários de Teste

#### Teste 1: Recuperação Após Recarregamento

**Passos**:
1. Iniciar sessão na aplicação
2. Iniciar um novo jogo
3. Fazer alguns movimentos
4. Pressionar F5 para recarregar a página
5. Aguardar reconexão

**Resultado Esperado**:
- Banner azul "A recuperar jogo..." aparece
- Jogo continua do ponto onde parou
- Todas as cartas e pontuação mantidas

#### Teste 2: Perda e Reconexão

**Passos**:
1. Iniciar jogo
2. Desligar WiFi/Ethernet
3. Aguardar 5 segundos
4. Religar conexão

**Resultado Esperado**:
- Banner vermelho "Conexão perdida" aparece
- Socket tenta reconectar automaticamente
- Banner azul "A tentar reconectar..." durante tentativas
- Jogo recupera automaticamente

#### Teste 3: Timeout de Servidor

**Passos**:
1. Iniciar jogo
2. Não fazer nenhum movimento por 5+ minutos
3. Tentar fazer movimento

**Resultado Esperado**:
- Modal laranja aparece
- Mensagem "Jogo foi encerrado devido a inatividade"
- Confirmação "As suas moedas foram devolvidas"
- Redirecionamento ao lobby após fechar modal

#### Teste 4: Falha Completa de Reconexão

**Passos**:
1. Iniciar jogo
2. Desligar servidor de WebSocket
3. Aguardar todas as 10 tentativas falharem

**Resultado Esperado**:
- Banner vermelho persiste
- Contador de tentativas incrementa (1/10, 2/10, etc.)
- Após 10 tentativas, estado limpo
- Utilizador pode voltar ao lobby manualmente

#### Teste 5: Múltiplas Abas

**Passos**:
1. Abrir jogo em aba A
2. Abrir mesma aplicação em aba B
3. Tentar iniciar jogo na aba B

**Resultado Esperado**:
- Apenas uma instância de jogo ativa por utilizador
- Aba B detecta jogo ativo e oferece recuperação

### Checklist de Validação

- [ ] Banner de status aparece e desaparece corretamente
- [ ] Contador de tentativas de reconexão visível
- [ ] Modal de anulação tem mensagem clara
- [ ] Moedas devolvidas após timeout
- [ ] URL atualizado com gameID após recuperação
- [ ] Estado limpo após anulação
- [ ] Sem duplicação de jogo na lista
- [ ] Logs no console são informativos

## Para Utilizadores Finais

### Como Funciona a Recuperação

#### Situação 1: Atualizei a Página por Engano

Não se preocupe! O jogo recupera automaticamente:

1. A página recarrega
2. Verá mensagem "A recuperar o seu jogo..."
3. Em poucos segundos, volta ao jogo
4. Todas as cartas e pontos mantidos

#### Situação 2: Perdi a Conexão à Internet

O sistema tenta reconectar automaticamente:

1. Verá "Conexão perdida. A reconectar..."
2. Sistema faz até 10 tentativas
3. Quando reconectar, jogo continua

#### Situação 3: Fiquei Inativo

Se não jogar por mais de 5 minutos:

1. Servidor encerra o jogo automaticamente
2. Verá mensagem explicativa
3. Suas moedas são devolvidas
4. Pode iniciar novo jogo no lobby

#### Situação 4: Aplicação Fechou

Se fechar o browser e voltar em menos de 5 minutos:

1. Faça login novamente
2. Jogo recupera automaticamente
3. Continue de onde parou

### Limitações

- **Tempo Máximo**: 5 minutos para recuperar
- **Moedas**: Devolvidas se jogo for anulado
- **Progresso**: Mantido apenas se servidor ainda tiver o jogo

## Troubleshooting

### Problema: Jogo Não Recupera

**Possíveis Causas**:
- Passou mais de 5 minutos
- Servidor reiniciou
- Jogo foi encerrado manualmente

**Solução**: Iniciar novo jogo no lobby

### Problema: Banner Não Desaparece

**Causa**: Problema de sincronização

**Solução**:
1. Abrir DevTools (F12)
2. Console > Verificar erros
3. Recarregar página (Ctrl+F5)

### Problema: Modal de Anulação Não Fecha

**Solução**: Pressionar ESC ou clicar fora do modal

### Problema: Múltiplas Instâncias do Jogo

**Solução**: Fechar todas as abas exceto uma e recarregar

## Boas Práticas

### Para Desenvolvedores

1. **Sempre use storeToRefs** para reatividade
2. **Não manipule localStorage diretamente** - use métodos da store
3. **Limpe watchers** em onUnmounted
4. **Use try-catch** ao trabalhar com recuperação
5. **Log operações críticas** para debug

### Para Testers

1. **Teste em diferentes browsers**
2. **Simule conexões lentas**
3. **Teste com VPN ligado/desligado**
4. **Verifique logs do servidor** paralelamente
5. **Documente cenários não cobertos**

## Exemplos de Código Completos

### Exemplo 1: Componente de Jogo com Recuperação

```vue
<template>
  <div>
    <ConnectionStatus />
    
    <GameAnnulledModal
      :show="showAnnulledModal"
      :message="annulledMessage"
      :reason="annulledReason"
      @close="handleAnnulmentClose"
    />

    <div v-if="isRecovering" class="recovery-overlay">
      <div class="spinner"></div>
      <p>A recuperar jogo...</p>
    </div>

    <div v-else-if="gameID">
      <GameBoard />
    </div>
    
    <div v-else>
      <LobbyScreen />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBiscaStore } from '@/stores/biscaStore'
import { useSocketStore } from '@/stores/socket'
import { useGameRecovery } from '@/composables/useGameRecovery'
import ConnectionStatus from '@/components/game/ConnectionStatus.vue'
import GameAnnulledModal from '@/components/game/GameAnnulledModal.vue'
import GameBoard from '@/components/game/GameBoard.vue'
import LobbyScreen from '@/components/game/LobbyScreen.vue'

const router = useRouter()
const biscaStore = useBiscaStore()
const socketStore = useSocketStore()

const { 
  gameID, 
  isRecovering, 
  showAnnulledModal, 
  annulledMessage, 
  annulledReason 
} = storeToRefs(biscaStore)

const { setupRecoveryWatchers, handlePageReload } = useGameRecovery()

onMounted(async () => {
  if (!socketStore.isConnected) {
    socketStore.connect()
  }

  setupRecoveryWatchers()
  
  await handlePageReload()
})

const handleAnnulmentClose = () => {
  biscaStore.closeAnnulledModal()
  router.push('/games/lobby')
}
</script>
```

### Exemplo 2: Botão Manual de Recuperação

```vue
<template>
  <button 
    @click="handleRecovery" 
    :disabled="isRecovering || !hasSavedGame"
    class="recovery-button"
  >
    <span v-if="isRecovering">A recuperar...</span>
    <span v-else>Recuperar Jogo</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBiscaStore } from '@/stores/biscaStore'
import { useGameRecovery } from '@/composables/useGameRecovery'
import { toast } from 'vue-sonner'

const biscaStore = useBiscaStore()
const { isRecovering } = storeToRefs(biscaStore)
const { attemptRecovery } = useGameRecovery()

const hasSavedGame = computed(() => {
  const state = biscaStore.loadPersistedState()
  return !!state?.gameID
})

const handleRecovery = async () => {
  const success = await attemptRecovery()
  
  if (success) {
    toast.success('Jogo recuperado com sucesso!')
  } else {
    toast.error('Não foi possível recuperar o jogo')
  }
}
</script>
```

## Recursos Adicionais

- **Documentação Técnica**: `RECOVERY_SYSTEM.md`
- **Requisitos Backend**: `BACKEND_REQUIREMENTS.md`
- **Issues GitHub**: Para reportar bugs
- **Discord/Slack**: Suporte da equipa

## Glossário

- **Recovery**: Processo de recuperação de estado
- **Reconnect**: Reconexão automática do socket
- **Annulled**: Jogo anulado/cancelado
- **Timeout**: Tempo limite excedido
- **Persist**: Guardar estado no localStorage
- **Hydrate**: Carregar estado guardado
- **TTL**: Time To Live (tempo de expiração)

---

**Última Atualização**: 2024
**Versão**: 1.0.0