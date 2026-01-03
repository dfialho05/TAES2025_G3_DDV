# Requisitos do Backend para Sistema de Recuperação

## Visão Geral

Este documento descreve os requisitos que o backend (API e WebSocket) deve implementar para suportar completamente o sistema de recuperação de estado do frontend.

## 1. API REST - Endpoints Necessários

### 1.1 POST /api/token

Cria um novo token API para o utilizador autenticado via sessão.

**Autenticação**: Cookie de sessão

**Resposta de Sucesso** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- 401: Não autenticado
- 500: Erro ao gerar token

**Implementação Laravel**:
```php
public function createToken(Request $request)
{
    $user = $request->user();
    
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }
    
    $token = $user->createToken('api_token')->plainTextToken;
    
    return response()->json(['token' => $token]);
}
```

### 1.2 GET /api/users/me

Retorna dados do utilizador autenticado, incluindo jogo ativo se existir.

**Autenticação**: Cookie de sessão ou Bearer Token

**Resposta de Sucesso** (200):
```json
{
  "data": {
    "id": 123,
    "name": "João Silva",
    "email": "joao@example.com",
    "type": "P",
    "coins_balance": 1500,
    "active_game_id": "game_abc123",
    "photo_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Nota**: `active_game_id` é opcional e deve ser preenchido se o utilizador tiver um jogo ativo no Redis.

## 2. WebSocket - Eventos Necessários

### 2.1 Evento: connect

**Servidor**: Aceitar conexão com autenticação via token.

**Validações**:
- Verificar token no `auth.token` do handshake
- Associar socket ao utilizador autenticado
- Registar conexão no Redis

**Implementação Node.js**:
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    socket.isGuest = true;
    return next();
  }
  
  try {
    const user = await verifyToken(token);
    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
});
```

### 2.2 Evento: join (Cliente → Servidor)

Utilizador anuncia sua identidade ao conectar.

**Payload**:
```json
{
  "id": 123,
  "name": "João Silva",
  "isGuest": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ações do Servidor**:
1. Registar utilizador no mapa de sockets ativos
2. Se tiver jogo ativo no Redis, verificar estado
3. Emitir lista de jogos disponíveis se aplicável

### 2.3 Evento: join-game (Cliente → Servidor)

Cliente tenta entrar ou re-entrar num jogo existente.

**Payload**:
```json
"game_abc123"
```

**Ações do Servidor**:
1. Verificar se jogo existe no Redis
2. Validar se utilizador é participante do jogo
3. Se jogo expirou (TTL), emitir `game_annulled` e devolver moedas
4. Se válido, adicionar socket à room do jogo
5. Emitir estado completo via `game_state` ou `game-joined`

**Validações**:
```javascript
const gameState = await redis.get(`game:${gameID}`);

if (!gameState) {
  socket.emit('game_annulled', {
    message: 'O jogo expirou devido a inatividade.',
    reason: 'timeout',
    refunded: true
  });
  return;
}

const game = JSON.parse(gameState);

if (game.player1Id !== socket.userId && game.player2Id !== socket.userId) {
  socket.emit('error', { message: 'Não autorizado a entrar neste jogo' });
  return;
}

socket.join(`game:${gameID}`);
socket.emit('game-joined', game);
```

### 2.4 Evento: game_annulled (Servidor → Cliente)

Notifica cliente que jogo foi anulado.

**Quando Emitir**:
- Jogo expirou por inatividade (Redis TTL)
- Jogador desconectou por tempo prolongado
- Erro irrecuperável no servidor
- Violação de regras

**Payload**:
```json
{
  "message": "O jogo foi encerrado devido a inatividade.",
  "reason": "timeout",
  "refunded": true,
  "gameID": "game_abc123"
}
```

**Campos**:
- `message`: Mensagem amigável para o utilizador
- `reason`: Código do motivo (timeout, disconnect, error, violation)
- `refunded`: Boolean indicando se moedas foram devolvidas
- `gameID`: ID do jogo anulado

### 2.5 Evento: game_timeout (Servidor → Cliente)

Variante específica de `game_annulled` para timeouts.

**Payload**: Igual a `game_annulled` mas com `reason: "timeout"`

### 2.6 Evento: game_state (Servidor → Cliente)

Envia estado completo ou atualização do jogo.

**Payload**:
```json
{
  "id": "game_abc123",
  "gameType": 3,
  "winsNeeded": 1,
  "player1Id": 123,
  "player2Id": 456,
  "p1Name": "João Silva",
  "p2Name": "Maria Santos",
  "player1Hand": [...],
  "player2Hand": [...],
  "trunfo": {...},
  "trunfoNaipe": "ouros",
  "tableCards": [...],
  "cardsLeft": 20,
  "turn": "player1",
  "score": {
    "player1": 45,
    "player2": 30
  },
  "matchWins": {
    "player1": 2,
    "player2": 1
  },
  "lastRoundPoints": {
    "player1": 65,
    "player2": 55
  },
  "gameOver": false,
  "roundOver": false,
  "logs": "Jogador 1 jogou 7 de Ouros"
}
```

### 2.7 Evento: reconnect (Servidor → Cliente)

Socket.io emite automaticamente, mas servidor deve tratar.

**Ação do Servidor**:
1. Re-verificar autenticação
2. Re-adicionar socket às rooms necessárias
3. Emitir estado atual se tiver jogo ativo

### 2.8 Evento: balance_update (Servidor → Cliente)

Notifica alteração no saldo de moedas.

**Payload**:
```json
{
  "userId": 123,
  "balance": 1500
}
```

## 3. Redis - Estrutura de Dados

### 3.1 Chave: game:{gameID}

Armazena estado completo do jogo.

**TTL**: 5 minutos (300 segundos)

**Estrutura**:
```json
{
  "id": "game_abc123",
  "gameType": 3,
  "winsNeeded": 1,
  "player1Id": 123,
  "player2Id": 456,
  "player1Hand": [...],
  "player2Hand": [...],
  "deck": [...],
  "trunfo": {...},
  "tableCards": [...],
  "turn": "player1",
  "score": {...},
  "matchWins": {...},
  "createdAt": 1234567890,
  "lastActivity": 1234567890
}
```

**Atualização TTL**:
```javascript
await redis.expire(`game:${gameID}`, 300);
```

### 3.2 Chave: user:{userId}:active_game

Mapeia utilizador para jogo ativo.

**TTL**: 5 minutos

**Valor**: gameID (string)

```javascript
await redis.setex(`user:${userId}:active_game`, 300, gameID);
```

### 3.3 Chave: game:{gameID}:bet

Armazena informação da aposta do jogo.

**TTL**: 5 minutos

**Estrutura**:
```json
{
  "player1Id": 123,
  "player2Id": 456,
  "betAmount": 100,
  "isPractice": false
}
```

## 4. Lógica de Anulação e Devolução

### 4.1 Critérios de Anulação

Um jogo deve ser anulado quando:

1. **Timeout por Inatividade**
   - Nenhum movimento em 5 minutos
   - Redis TTL expira naturalmente

2. **Desconexão Prolongada**
   - Jogador desconecta e não retorna em 2 minutos
   - Apenas se jogo não iniciou efetivamente

3. **Erro de Servidor**
   - Exceção não tratada
   - Corrupção de estado

### 4.2 Processo de Devolução

Quando jogo é anulado:

1. Verificar se apostas foram feitas
2. Devolver moedas aos jogadores
3. Registar transação de devolução
4. Emitir evento `game_annulled` para ambos
5. Limpar estado do Redis

**Exemplo**:
```javascript
async function annulGame(gameID, reason) {
  const game = await getGameState(gameID);
  const bet = await getBetInfo(gameID);
  
  if (bet && bet.betAmount > 0 && !bet.isPractice) {
    await refundBet(bet.player1Id, bet.betAmount);
    await refundBet(bet.player2Id, bet.betAmount);
    
    await createTransaction({
      userId: bet.player1Id,
      type: 'refund',
      amount: bet.betAmount,
      reason: `Jogo ${gameID} anulado: ${reason}`
    });
  }
  
  io.to(`game:${gameID}`).emit('game_annulled', {
    message: getAnnulmentMessage(reason),
    reason: reason,
    refunded: bet?.betAmount > 0,
    gameID: gameID
  });
  
  await redis.del(`game:${gameID}`);
  await redis.del(`game:${gameID}:bet`);
  await redis.del(`user:${bet.player1Id}:active_game`);
  await redis.del(`user:${bet.player2Id}:active_game`);
}
```

## 5. Segurança e Validações

### 5.1 Validação de Token

- Verificar assinatura JWT
- Validar expiração
- Comparar userId do token com ação solicitada

### 5.2 Validação de Ações

Antes de permitir qualquer ação no jogo:

1. Verificar se é o turno do jogador
2. Validar movimento segundo regras
3. Verificar se jogo ainda está ativo
4. Confirmar identidade do jogador

### 5.3 Rate Limiting

Implementar rate limiting para prevenir spam:

- Máximo 10 conexões por IP por minuto
- Máximo 60 ações por jogo por minuto
- Máximo 5 tentativas de reconexão por minuto

### 5.4 Prevenção de Exploits

- Validar todos movimentos no servidor (nunca confiar no cliente)
- Verificar estado do jogo antes de cada ação
- Prevenir manipulação de moedas
- Logar ações suspeitas

## 6. Monitorização e Logs

### 6.1 Métricas Importantes

- Taxa de recuperação bem-sucedida
- Tempo médio de reconexão
- Frequência de anulações por tipo
- Número de jogos ativos simultâneos

### 6.2 Logs Necessários

```javascript
logger.info('Game recovered', {
  gameID,
  userId,
  timeSinceDisconnect,
  recoveryAttempts
});

logger.warn('Game annulled', {
  gameID,
  reason,
  player1Id,
  player2Id,
  refundAmount
});

logger.error('Recovery failed', {
  gameID,
  userId,
  error: err.message,
  state: gameState
});
```

## 7. Testes Recomendados

### 7.1 Testes Unitários

- Validação de token
- Lógica de anulação
- Cálculo de devolução
- Verificação de TTL

### 7.2 Testes de Integração

- Fluxo completo de recuperação
- Reconexão após desconexão
- Anulação por timeout
- Devolução de moedas

### 7.3 Testes de Carga

- 100 jogos simultâneos
- 50 reconexões simultâneas
- Stress test de Redis
- Falha de servidor simulada

## 8. Exemplo de Implementação Completa

### 8.1 Socket Handler

```javascript
io.on('connection', async (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join', async (userData) => {
    socket.userData = userData;
    
    const activeGame = await redis.get(`user:${userData.id}:active_game`);
    if (activeGame) {
      socket.emit('active_game_found', { gameID: activeGame });
    }
  });
  
  socket.on('join-game', async (gameID) => {
    const gameState = await redis.get(`game:${gameID}`);
    
    if (!gameState) {
      await handleGameExpired(socket, gameID);
      return;
    }
    
    const game = JSON.parse(gameState);
    
    if (!canJoinGame(socket.userData.id, game)) {
      socket.emit('error', { message: 'Não autorizado' });
      return;
    }
    
    socket.join(`game:${gameID}`);
    socket.gameID = gameID;
    
    await redis.expire(`game:${gameID}`, 300);
    
    socket.emit('game-joined', game);
  });
  
  socket.on('disconnect', async () => {
    if (socket.gameID) {
      await handlePlayerDisconnect(socket);
    }
  });
});
```

### 8.2 Expiração Handler

```javascript
async function handleGameExpired(socket, gameID) {
  const bet = await redis.get(`game:${gameID}:bet`);
  
  if (bet) {
    const betInfo = JSON.parse(bet);
    
    if (!betInfo.isPractice && betInfo.betAmount > 0) {
      await refundBet(betInfo.player1Id, betInfo.betAmount);
      await refundBet(betInfo.player2Id, betInfo.betAmount);
    }
  }
  
  socket.emit('game_annulled', {
    message: 'O jogo expirou devido a inatividade. As suas moedas foram devolvidas.',
    reason: 'timeout',
    refunded: true,
    gameID: gameID
  });
  
  await cleanupGame(gameID);
}
```

## 9. Checklist de Implementação

- [ ] Endpoint POST /api/token implementado
- [ ] Campo active_game_id em GET /api/users/me
- [ ] Autenticação via token no WebSocket
- [ ] Evento join-game com recuperação
- [ ] Evento game_annulled implementado
- [ ] Evento game_timeout implementado
- [ ] Redis com TTL de 5 minutos
- [ ] Chave user:active_game criada
- [ ] Lógica de devolução de moedas
- [ ] Logs de recuperação e anulação
- [ ] Validações de segurança
- [ ] Testes de recuperação
- [ ] Documentação atualizada

## 10. Troubleshooting Backend

### Problema: Token expirado não faz refresh

**Solução**: Verificar se endpoint /api/token está acessível via sessão.

### Problema: Jogo não recupera após refresh

**Solução**: Verificar se TTL do Redis está correto e se chave user:active_game existe.

### Problema: Moedas não devolvidas

**Solução**: Verificar logs de devolução e tabela de transações.

### Problema: Múltiplas anulações do mesmo jogo

**Solução**: Adicionar flag `annulled` no estado do jogo para prevenir duplicação.

---

## Contacto

Para dúvidas ou problemas na implementação, consultar a documentação completa em `frontend/RECOVERY_SYSTEM.md`.