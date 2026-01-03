# Guia de Início Rápido - Sistema de Recuperação

## Em 5 Minutos

### 1. Verificar Arquivos Criados

```bash
# Novos componentes
ls src/components/game/ConnectionStatus.vue
ls src/components/game/GameAnnulledModal.vue

# Novo composable
ls src/composables/useGameRecovery.js

# Stores atualizadas
ls src/stores/biscaStore.js
ls src/stores/socketStore.js
ls src/stores/auth.js

# Documentação
ls RECOVERY_SYSTEM.md
ls BACKEND_REQUIREMENTS.md
ls USAGE_GUIDE.md
```

### 2. Instalar Dependências (se necessário)

```bash
npm install
```

### 3. Executar Aplicação

```bash
npm run dev
```

### 4. Testar Recuperação Básica

1. Abrir `http://localhost:5173`
2. Fazer login
3. Iniciar um jogo
4. Pressionar **F5** para recarregar
5. Verificar que o jogo continua automaticamente

✅ Se funcionou, o sistema está operacional!

## Como Funciona

### Fluxo Simplificado

```
Utilizador joga → Estado guardado no localStorage
                → Página recarrega ou perde conexão
                → Sistema detecta estado guardado
                → Reconecta ao servidor
                → Recupera jogo automaticamente
```

### Componentes Principais

1. **biscaStore**: Gere estado do jogo e persistência
2. **socketStore**: Trata reconexões automáticas
3. **ConnectionStatus**: Mostra status visual
4. **GameAnnulledModal**: Notifica anulações
5. **useGameRecovery**: Lógica reutilizável

## Integração Rápida

### Em Componente Novo

```vue
<template>
  <ConnectionStatus />
  <YourGameComponent />
</template>

<script setup>
import ConnectionStatus from '@/components/game/ConnectionStatus.vue'
import { useGameRecovery } from '@/composables/useGameRecovery'
import { onMounted } from 'vue'

const { setupRecoveryWatchers, handlePageReload } = useGameRecovery()

onMounted(async () => {
  setupRecoveryWatchers()
  await handlePageReload()
})
</script>
```

### Aceder a Estados

```javascript
import { storeToRefs } from 'pinia'
import { useBiscaStore } from '@/stores/biscaStore'

const biscaStore = useBiscaStore()
const { isRecovering, connectionLost, gameID } = storeToRefs(biscaStore)
```

## Configuração Backend (IMPORTANTE)

O frontend está completo mas **precisa** que o backend implemente:

### 1. Endpoint de Token

```javascript
POST /api/token
Response: { "token": "..." }
```

### 2. Eventos WebSocket

```javascript
socket.on('join-game', gameID => {
  // Recuperar jogo do Redis
  // Validar utilizador
  // Emitir game_state
})

socket.emit('game_annulled', {
  message: "...",
  reason: "timeout",
  refunded: true
})
```

### 3. Redis com TTL

```javascript
await redis.setex(`game:${gameID}`, 300, JSON.stringify(gameState))
```

📖 **Detalhes completos**: Ver `BACKEND_REQUIREMENTS.md`

## Testes Rápidos

### Teste 1: Refresh (30 segundos)

```
1. Iniciar jogo
2. F5
3. Jogo deve continuar ✅
```

### Teste 2: Perda de Conexão (1 minuto)

```
1. Iniciar jogo
2. Desligar WiFi por 10 segundos
3. Religar WiFi
4. Jogo deve recuperar ✅
```

### Teste 3: Modal de Anulação (5+ minutos)

```
1. Iniciar jogo
2. Aguardar 6 minutos sem jogar
3. Modal deve aparecer
4. Moedas devolvidas ✅
```

## Troubleshooting Rápido

### Jogo não recupera

**Causa**: Passou mais de 5 minutos
**Solução**: Iniciar novo jogo

### Banner não desaparece

**Causa**: Socket não reconectou
**Solução**: Verificar servidor WebSocket está a correr

### Modal não fecha

**Solução**: Pressionar ESC ou recarregar página

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   └── game/
│   │       ├── ConnectionStatus.vue      ← NOVO
│   │       └── GameAnnulledModal.vue     ← NOVO
│   ├── composables/
│   │   └── useGameRecovery.js            ← NOVO
│   ├── stores/
│   │   ├── biscaStore.js                 ← MODIFICADO
│   │   ├── socketStore.js                ← MODIFICADO
│   │   └── auth.js                       ← MODIFICADO
│   ├── pages/
│   │   └── game/
│   │       └── Game.vue                  ← MODIFICADO
│   ├── App.vue                           ← MODIFICADO
│   └── main.js                           ← MODIFICADO
└── docs/
    ├── RECOVERY_SYSTEM.md                ← NOVO
    ├── BACKEND_REQUIREMENTS.md           ← NOVO
    ├── USAGE_GUIDE.md                    ← NOVO
    ├── IMPLEMENTATION_SUMMARY.md         ← NOVO
    ├── CHECKLIST.md                      ← NOVO
    └── QUICK_START.md                    ← ESTE ARQUIVO
```

## Próximos Passos

### Imediatos

1. ✅ Frontend completo
2. ⏳ Implementar backend (ver BACKEND_REQUIREMENTS.md)
3. ⏳ Testar integração completa
4. ⏳ Deploy

### Opcionais

- Testes E2E automatizados
- Métricas de recuperação
- Otimizações de performance

## Recursos

- **Documentação Técnica**: `RECOVERY_SYSTEM.md` (405 linhas)
- **Requisitos Backend**: `BACKEND_REQUIREMENTS.md` (573 linhas)
- **Guia de Uso**: `USAGE_GUIDE.md` (526 linhas)
- **Sumário**: `IMPLEMENTATION_SUMMARY.md` (347 linhas)
- **Checklist**: `CHECKLIST.md` (278 linhas)

## Configurações Chave

| Item | Valor |
|------|-------|
| TTL Estado | 5 minutos |
| Tentativas Reconexão | 10 |
| Timeout Recuperação | 5 segundos |
| Key localStorage | `bisca_game_state` |

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# Ver logs socket
localStorage.debug = 'socket.io-client:*'
```

## Suporte

- 📖 Ler documentação completa em `RECOVERY_SYSTEM.md`
- 🐛 Reportar bugs via GitHub Issues
- 💬 Dúvidas: Consultar `USAGE_GUIDE.md`

---

**Status**: ✅ PRONTO PARA USO (aguarda backend)

**Tempo de leitura**: 5 minutos
**Tempo de implementação backend**: 2-4 horas
**Tempo de testes**: 1 hora

**Última atualização**: 2024