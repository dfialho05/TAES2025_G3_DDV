# 🔄 Sistema de Recuperação e Resiliência - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Fluxos de Funcionamento](#fluxos-de-funcionamento)
6. [API de Recuperação](#api-de-recuperação)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)
9. [Testes](#testes)

---

## 🎯 Visão Geral

O **Sistema de Recuperação e Resiliência** foi desenvolvido para garantir:

- ✅ **Persistência**: Estado dos jogos sobrevive a reinícios do servidor
- ✅ **Escalabilidade Horizontal**: Múltiplos nós WebSocket compartilham estado
- ✅ **Recuperação Automática**: Clientes reconectam-se automaticamente aos jogos
- ✅ **Proteção de Fundos**: Reembolso automático em caso de falhas
- ✅ **Monitoramento Ativo**: Watchdog detecta e resolve problemas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente WebSocket                         │
│                  (Frontend - Browser)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Socket.IO
                          │
┌─────────────────────────┴───────────────────────────────────┐
│              Servidor WebSocket (Node.js)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Socket.IO Server + Redis Adapter                  │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│  ┌────────────┬──────────┴──────────┬───────────────┐       │
│  │ Recovery   │  Game State Sync    │  Watchdog     │       │
│  │ Manager    │  (10s interval)     │  Worker       │       │
│  └────────────┴─────────────────────┴───────────────┘       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Redis Protocol
                           │
┌──────────────────────────┴────────────────────────────────┐
│                     Redis Server                           │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Game State Storage (Persistent)                  │     │
│  │  - game:{id}           (Estado do jogo)           │     │
│  │  - player_game:{id}    (Mapeamento jogador)      │     │
│  │  - game_heartbeat:{id} (Health check)            │     │
│  │  - game_meta:{id}      (Metadata)                │     │
│  │  - active_games        (Set de jogos ativos)     │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST
                           │
┌──────────────────────────┴────────────────────────────────┐
│                   Laravel API (Backend)                    │
│  - Gestão de utilizadores e autenticação                   │
│  - Transações de moedas (stakes/reembolsos)               │
│  - Histórico de jogos e matches                           │
└────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes

### 1. **Redis Client** (`redis/client.js`)

Gestão das conexões Redis com retry automático e health checks.

**Funcionalidades:**
- 3 clientes Redis (principal, subscriber, publisher)
- Retry automático em caso de falha
- Health checks periódicos
- Graceful shutdown

**Configuração:**
```javascript
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=        # Opcional
REDIS_DB=0
```

---

### 2. **Game State Manager** (`redis/gameStateManager.js`)

Responsável pela persistência do estado dos jogos no Redis.

**Funcionalidades:**
- `saveGameState()` - Salva estado completo de um jogo
- `getGameState()` - Recupera estado de um jogo
- `deleteGameState()` - Remove jogo do Redis
- `mapPlayerToGame()` - Mapeia jogador ao seu jogo ativo
- `getPlayerGame()` - Obtém jogo ativo de um jogador
- `updateGameHeartbeat()` - Atualiza heartbeat (servidor vivo)
- `findOrphanedGames()` - Encontra jogos órfãos (sem servidor)

**Estrutura de Dados no Redis:**
```
game:123                 → Estado completo do jogo (JSON)
player_game:user456      → ID do jogo ativo do jogador
game_heartbeat:123       → Timestamp + Server ID
game_meta:123            → Metadata (stake, isMatch, etc)
active_games             → Set com IDs de todos os jogos ativos
```

---

### 3. **Recovery Manager** (`redis/recoveryManager.js`)

Sistema de recuperação para reconexões e reinícios.

**Funcionalidades:**
- `attemptGameRecovery()` - Recupera jogo quando cliente reconecta
- `recoverAllGamesOnStartup()` - Recupera todos os jogos após restart
- `syncGameToRedis()` - Sincroniza jogo da memória para Redis
- `startPeriodicSync()` - Inicia sincronização automática (10s)
- `handleClientReconnection()` - Handler para reconexões

**Fluxo de Recuperação:**
1. Cliente desconecta
2. Estado permanece no Redis (TTL: 2h)
3. Cliente reconecta
4. Sistema identifica jogo ativo
5. Cliente é readicionado à sala
6. Estado é enviado ao cliente
7. Jogo continua normalmente

---

### 4. **Watchdog Worker** (`workers/watchdog.js`)

Monitor que detecta e resolve problemas de timeouts.

**Funcionalidades:**
- Verifica jogos a cada 30s
- Detecta servidores que não respondem (sem heartbeat)
- Processa reembolsos automáticos
- Cancela jogos/matches na API Laravel
- Limpa estado do Redis

**Critérios de Timeout:**
- Sem heartbeat há mais de 2 minutos
- Jogo com duração superior a 1 hora
- Estado inconsistente

**Processo de Timeout:**
1. Watchdog detecta jogo órfão
2. Recupera informações dos jogadores
3. Calcula valor do stake (2 coins ou 10 coins)
4. Processa reembolso via API Laravel
5. Notifica clientes (se conectados)
6. Cancela match/game na BD
7. Remove estado do Redis

---

## 🚀 Instalação e Configuração

### Passo 1: Instalar Redis

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**MacOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download em: https://github.com/microsoftarchive/redis/releases

### Passo 2: Verificar Redis

```bash
redis-cli ping
# Deve retornar: PONG
```

### Passo 3: Instalar Dependências Node.js

```bash
cd websockets
npm install
```

**Novas dependências instaladas:**
- `redis` - Cliente Redis oficial
- `ioredis` - Cliente Redis com features avançadas
- `@socket.io/redis-adapter` - Adapter para multi-node
- `dotenv` - Gestão de variáveis de ambiente

### Passo 4: Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

**Editar `.env`:**
```env
# Servidor
SERVER_ID=websocket-server-1
WEBSOCKET_PORT=3000

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Watchdog
WATCHDOG_INTERVAL=30000        # 30 segundos
GAME_TIMEOUT_MS=120000         # 2 minutos
MAX_GAME_DURATION_MS=3600000   # 1 hora
HEARTBEAT_TTL=180              # 3 minutos

# Sincronização
SYNC_INTERVAL=10000            # 10 segundos
DEFAULT_GAME_TTL=7200          # 2 horas

# Laravel API
LARAVEL_API_URL=http://127.0.0.1:8000/api
API_TIMEOUT=5000
```

### Passo 5: Iniciar Servidor

```bash
npm run dev     # Modo desenvolvimento (auto-reload)
npm start       # Modo produção
```

---

## 📊 Fluxos de Funcionamento

### Fluxo 1: Criação de Jogo com Persistência

```
1. Cliente cria jogo → createGame()
2. Jogo criado em memória (BiscaGame)
3. Estado salvo no Redis → saveGameState()
4. Jogadores mapeados → mapPlayerToGame()
5. Metadata salva → saveGameMetadata()
6. Heartbeat iniciado → updateGameHeartbeat()
7. Cliente recebe confirmação
```

### Fluxo 2: Reconexão de Cliente

```
1. Cliente desconecta (rede, browser crash, etc)
2. Jogo permanece no Redis
3. Cliente reconecta com mesmo token
4. handleClientReconnection() detecta usuário
5. attemptGameRecovery() busca jogo ativo
6. getPlayerGame() retorna ID do jogo
7. getGameState() recupera estado completo
8. Cliente é readicionado à sala
9. Estado é enviado ao cliente
10. Notificação enviada ao oponente
11. Jogo continua normalmente
```

### Fluxo 3: Reinício do Servidor

```
1. Servidor para (manutenção, crash, deploy)
2. Estado de todos os jogos está no Redis
3. Servidor reinicia
4. recoverAllGamesOnStartup() é executado
5. getAllActiveGames() lista jogos ativos
6. Para cada jogo:
   - getGameState() recupera estado
   - Verifica se está terminado
   - updateGameHeartbeat() marca servidor ativo
7. Servidor pronto para receber reconexões
8. Clientes reconectam e recuperam jogos
```

### Fluxo 4: Timeout e Reembolso

```
1. Watchdog verifica jogos a cada 30s
2. Para cada jogo ativo:
   - Verifica heartbeat
   - Calcula tempo desde último heartbeat
   - Se > 2min → TIMEOUT
3. Processo de timeout:
   - Recupera dados dos jogadores
   - Identifica stake (2 ou 10 coins)
   - Chama refundCoins() na API Laravel
   - Laravel adiciona coins de volta
   - Notifica clientes via WebSocket
   - Cancela match/game na BD
   - Remove estado do Redis
4. Jogadores recebem coins de volta
```

### Fluxo 5: Escalabilidade Horizontal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Servidor 1 │     │  Servidor 2 │     │  Servidor 3 │
│   (Port 3000)│    │   (Port 3001)│    │   (Port 3002)│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                  ┌────────┴────────┐
                  │  Redis Pub/Sub  │
                  │   + Adapter     │
                  └─────────────────┘

1. Jogador A conecta ao Servidor 1
2. Jogador B conecta ao Servidor 2
3. Redis Adapter sincroniza mensagens
4. Ambos jogam normalmente no mesmo jogo
5. Estado compartilhado via Redis
```

---

## 🔌 API de Recuperação

### Eventos do Cliente para Servidor

#### `join`
Registra usuário no servidor.
```javascript
socket.emit('join', {
  id: userId,
  name: userName,
  token: authToken
});
```

### Eventos do Servidor para Cliente

#### `game_recovered`
Enviado quando um jogo é recuperado.
```javascript
{
  gameId: 123,
  gameState: { /* estado completo */ },
  playerRole: "Player 1" | "Player 2",
  message: "Jogo recuperado com sucesso!"
}
```

#### `reconnection_complete`
Enviado após reconexão bem-sucedida.
```javascript
{
  userId: "456",
  hasActiveGame: true,
  gameId: 123,
  message: "Reconectado com sucesso!"
}
```

#### `player_disconnected`
Notifica que um jogador desconectou.
```javascript
{
  playerId: "456",
  gameId: 123,
  message: "Um jogador desconectou. Aguardando reconexão...",
  waitTime: 60  // segundos
}
```

#### `player_reconnected`
Notifica que um jogador reconectou.
```javascript
{
  playerId: "456",
  playerRole: "Player 2",
  message: "Player 2 reconectou-se ao jogo."
}
```

#### `game_cancelled`
Jogo cancelado por timeout.
```javascript
{
  gameId: 123,
  reason: "Servidor não responde (sem heartbeat)",
  refundAmount: 10,
  userId: "456",
  message: "Jogo cancelado por timeout. 10 coins foram reembolsadas."
}
```

#### `balance_update`
Atualização de saldo.
```javascript
{
  userId: "456",
  balance: 150
}
```

---

## 📈 Monitoramento

### Logs do Sistema

**Servidor iniciado:**
```
✅ [Redis] Cliente principal conectado
✅ [Redis] Subscriber conectado
✅ [Redis] Publisher conectado
✅ [Redis] Conexão estabelecida e saudável
✅ [Socket.IO] Redis Adapter configurado para multi-node support
🔄 [Recovery] Iniciando recuperação de jogos após reinício...
   📊 Jogos ativos encontrados: 3
   ✅ Jogo 1 recuperado com sucesso
   ✅ Jogo 2 recuperado com sucesso
   ✅ Jogo 3 recuperado com sucesso
📊 [Recovery] Resumo da recuperação:
   ✅ Recuperados: 3
   ❌ Falhados: 0
   📈 Total: 3
✅ [Recovery] Sincronização periódica iniciada
🐕 [Watchdog] Iniciando Worker...
   Intervalo: 30s
   Timeout: 120s sem heartbeat
   Duração máxima: 60 minutos
```

**Reconexão de Cliente:**
```
🔌 [Recovery] Cliente reconectado: João Silva (123)
🔄 [Recovery] Tentando recuperar jogo para jogador 123
   🎮 Jogo ativo encontrado: 42
   👤 Jogador identificado como: Player 1
   ✅ Jogador 123 readicionado à sala game-42
   ✅ Recuperação concluída para jogador 123
```

**Timeout Detectado:**
```
🐕 [Watchdog] Iniciando verificação (Ciclo #5)
   Jogos ativos: 1
   ⚠️  Jogo 42 em TIMEOUT!
⏰ [Watchdog] Processando timeout do jogo 42
   Razão: Servidor não responde (sem heartbeat)
   Player 1: João Silva (ID: 123)
   Player 2: Maria Santos (ID: 456)
   💰 Stake: 10 coins (Match)
   💸 Reembolsando 10 coins para João Silva (ID: 123)
   ✅ Reembolso concluído para João Silva
   💸 Reembolsando 10 coins para Maria Santos (ID: 456)
   ✅ Reembolso concluído para Maria Santos
   🗑️  Cancelando Match 15 na BD
   ✅ Match 15 cancelada
   🧹 Limpeza do jogo 42 concluída
✅ [Watchdog] Jogo 42 processado com sucesso
```

### Comandos Redis CLI

**Ver jogos ativos:**
```bash
redis-cli SMEMBERS active_games
```

**Ver estado de um jogo:**
```bash
redis-cli GET game:123
```

**Ver jogo ativo de um jogador:**
```bash
redis-cli GET player_game:456
```

**Ver heartbeat de um jogo:**
```bash
redis-cli GET game_heartbeat:123
```

**Ver estatísticas:**
```bash
redis-cli INFO stats
redis-cli DBSIZE
```

**Limpar todos os dados (CUIDADO!):**
```bash
redis-cli FLUSHDB
```

---

## 🔧 Troubleshooting

### Problema: Redis não conecta

**Sintomas:**
```
❌ [Redis] Erro no cliente principal: connect ECONNREFUSED
```

**Soluções:**
1. Verificar se Redis está rodando: `redis-cli ping`
2. Verificar porta: `netstat -an | grep 6379`
3. Verificar configuração no `.env`
4. Reiniciar Redis: `sudo systemctl restart redis`

---

### Problema: Jogos não são recuperados

**Sintomas:**
```
⚠️  [Recovery] Estado do jogo 123 não encontrado no Redis
```

**Causas possíveis:**
1. TTL expirou (jogo ficou inativo por mais de 2h)
2. Redis foi limpo manualmente (FLUSHDB)
3. Servidor não sincronizou antes de crashar

**Soluções:**
1. Verificar TTL: Aumentar `DEFAULT_GAME_TTL` no `.env`
2. Verificar sincronização: Reduzir `SYNC_INTERVAL`
3. Verificar logs de sincronização

---

### Problema: Reembolsos não são processados

**Sintomas:**
```
❌ [Laravel] Falha ao processar reembolso para user 123
```

**Causas possíveis:**
1. API Laravel offline
2. Endpoint `/refund` não implementado
3. Token inválido ou expirado

**Soluções:**
1. Verificar se Laravel está rodando: `curl http://127.0.0.1:8000/api`
2. Implementar endpoint de reembolso (ver Laravel API)
3. Verificar logs da API Laravel

---

### Problema: Watchdog não detecta timeouts

**Sintomas:**
```
🐕 [Watchdog] Iniciando verificação
   Jogos ativos: 5
   Jogos com timeout: 0
```

**Causas possíveis:**
1. Heartbeats sendo atualizados corretamente
2. GAME_TIMEOUT_MS muito alto
3. Watchdog com intervalo muito grande

**Soluções:**
1. Reduzir `GAME_TIMEOUT_MS` para testar
2. Verificar logs de heartbeat
3. Forçar verificação manual (ver Testes)

---

## 🧪 Testes

### Teste 1: Reconexão de Cliente

```javascript
// No navegador
// 1. Criar jogo
// 2. Abrir DevTools → Network
// 3. Simular offline/online
// 4. Verificar logs no servidor

// Esperado:
// - Cliente reconecta automaticamente
// - Jogo é recuperado
// - Estado é restaurado
```

### Teste 2: Reinício do Servidor

```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Criar jogo via cliente
# ...

# Terminal 1: Parar servidor (Ctrl+C)
# Reiniciar servidor
npm start

# Verificar logs:
# - Jogos recuperados: X
# - Cliente reconecta e recupera jogo
```

### Teste 3: Timeout e Reembolso

```bash
# 1. Criar jogo com stakes
# 2. Parar de enviar heartbeats (comentar código)
# 3. Aguardar 2+ minutos
# 4. Verificar logs do Watchdog

# Esperado:
# - Timeout detectado
# - Reembolso processado
# - Jogo removido do Redis
```

### Teste 4: Verificação Manual do Watchdog

```javascript
// Criar ficheiro test-watchdog.js
import { manualCheck } from './workers/watchdog.js';

await manualCheck();
```

```bash
node test-watchdog.js
```

### Teste 5: Multi-Node

```bash
# Terminal 1
SERVER_ID=node-1 WEBSOCKET_PORT=3000 npm start

# Terminal 2
SERVER_ID=node-2 WEBSOCKET_PORT=3001 npm start

# Terminal 3
SERVER_ID=node-3 WEBSOCKET_PORT=3002 npm start

# Conectar jogadores em portas diferentes
# Verificar se conseguem jogar juntos
```

---

## 📚 Referências

### Documentação Oficial

- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Commands](https://redis.io/commands)

### Arquivos do Sistema

- `redis/client.js` - Cliente Redis
- `redis/gameStateManager.js` - Gestão de estado
- `redis/recoveryManager.js` - Sistema de recuperação
- `workers/watchdog.js` - Monitor de timeouts
- `services/laravel.js` - API Laravel
- `index.js` - Servidor principal

---

## 🎓 Boas Práticas

1. **Sempre sincronizar estado crítico** - Use `syncGameToRedis()` após mudanças importantes
2. **Tratar erros do Redis** - Redis pode falhar, tenha fallbacks
3. **Monitorar heartbeats** - Garanta que estão sendo enviados regularmente
4. **Testar recuperação** - Simule crashes e reconexões frequentemente
5. **Logs estruturados** - Facilita debug em produção
6. **Backups Redis** - Configure RDB ou AOF para persistência
7. **Segurança Redis** - Use password em produção
8. **Rate limiting** - Proteja endpoints de reembolso

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do servidor
2. Verificar logs do Redis
3. Testar endpoints da API Laravel
4. Consultar esta documentação
5. Contactar a equipa de desenvolvimento

---

**Versão:** 1.0.0  
**Última atualização:** 2025  
**Equipa:** TAES2025_G3_DDV