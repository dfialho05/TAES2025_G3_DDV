# Guia Rápido de Correção - Erro de Recuperação

## Problema
```
[Recovery] Socket sem usuário válido para recuperar
```

## Solução em 3 Passos

### 1. Criar Middleware de Autenticação

Criar arquivo `middleware/auth.js`:

```javascript
import axios from "axios";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000/api";

export const authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.data.user = null;
      socket.data.isGuest = true;
      return next();
    }

    try {
      const response = await axios.get(`${LARAVEL_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 5000,
      });

      const userData = response.data.data || response.data;

      socket.data.user = {
        id: String(userData.id),
        name: userData.name,
        email: userData.email,
        token: token,
      };

      socket.data.isGuest = false;
      return next();
    } catch (apiError) {
      socket.data.user = null;
      socket.data.isGuest = true;
      return next();
    }
  } catch (error) {
    return next(new Error("Erro interno de autenticação"));
  }
};
```

### 2. Atualizar index.js

```javascript
import { authMiddleware } from "./middleware/auth.js";

// Adicionar ANTES de io.on('connection')
io.use(authMiddleware);

io.on("connection", async (socket) => {
  const user = socket.data.user;
  
  if (user) {
    console.log(`[Connection] ${user.name} conectado`);
  } else if (socket.data.isGuest) {
    const anonymousUser = {
      id: `guest_${socket.id}`,
      name: `Guest ${socket.id.substring(0, 4)}`,
      token: null,
      isGuest: true,
    };
    addUser(socket.id, anonymousUser);
    socket.data.user = anonymousUser;
  }
  
  await handleClientReconnection(socket, io);
  gameHandlers(io, socket);
  connectionsHandlers(io, socket);
});
```

### 3. Atualizar recoveryManager.js

No `handleClientReconnection`:

```javascript
export const handleClientReconnection = async (socket, io) => {
  try {
    const user = socket.data.user;

    if (!user || !user.id || socket.data.isGuest) {
      console.log(`[Recovery] Socket sem usuário válido`);
      return;
    }

    console.log(`[Recovery] Cliente reconectado: ${user.name}`);
    
    addUser(socket.id, user);
    
    const recovery = await attemptGameRecovery(user.id, socket, io);

    if (recovery && recovery.recovered) {
      socket.emit("reconnection_complete", {
        userId: user.id,
        hasActiveGame: true,
        gameId: recovery.gameId,
      });
    } else {
      socket.emit("reconnection_complete", {
        userId: user.id,
        hasActiveGame: false,
      });
    }
  } catch (error) {
    socket.emit("recovery_error", {
      message: "Erro ao processar reconexão",
      shouldRedirect: true,
      redirectTo: "/games/lobby",
    });
  }
};
```

No `attemptGameRecovery`, adicionar sincronização de socket.id:

```javascript
// Após verificar que o jogador pertence ao jogo
const room = `game-${gameId}`;
socket.join(room);

// NOVO: Atualizar socket.id no Redis
if (gameState.player1?.id === playerId) {
  gameState.player1.socketId = socket.id;
} else if (gameState.player2?.id === playerId) {
  gameState.player2.socketId = socket.id;
}

await saveGameState(gameId, gameState);
await updateGameHeartbeat(gameId);
```

## 4. Adicionar Handler no Frontend (Opcional)

Em `frontend/src/stores/socket.js`:

```javascript
socket.value.on('recovery_error', (data) => {
  console.error('[Socket] Erro de recuperação:', data)
  biscaStore.resetGameState()
  
  if (data.shouldRedirect) {
    window.location.href = data.redirectTo
  }
})

socket.value.on('game_recovered', (data) => {
  console.log('[Socket] Jogo recuperado:', data)
  if (data.gameState) {
    biscaStore.processGameState(data.gameState)
  }
})
```

## Testar

```bash
# 1. Reiniciar servidor
npm start

# 2. Abrir frontend
npm run dev

# 3. Fazer login
# 4. Iniciar jogo
# 5. F5 (recarregar)
# 6. Verificar: "Jogo recuperado com sucesso"
```

## Checklist

- [ ] Middleware criado em `middleware/auth.js`
- [ ] `io.use(authMiddleware)` adicionado no `index.js`
- [ ] `handleClientReconnection` atualizado
- [ ] `attemptGameRecovery` sincroniza socket.id
- [ ] Frontend trata `recovery_error`
- [ ] Endpoint `/api/users/me` existe no Laravel
- [ ] Variável `LARAVEL_API_URL` configurada
- [ ] Servidor reiniciado
- [ ] Teste de recuperação passou

## Resultado Esperado

```
[Auth] Validando token para socket abc123...
[Auth] Usuário autenticado: João Silva (ID: 45)
[Connection] Socket abc123 conectado: João Silva
[Recovery] Cliente reconectado: João Silva (45)
[Recovery] Jogo ativo encontrado: 123
[Recovery] Socket.id atualizado no Redis
[Recovery] Jogador 45 readicionado à sala game-123
[Recovery] Jogo recuperado com sucesso
```

## Troubleshooting

### Ainda recebe "usuário inválido"?

1. Verificar se middleware está registado ANTES de `io.on('connection')`
2. Verificar logs: `[Auth] Usuário autenticado`
3. Verificar se API Laravel responde em `/api/users/me`

### Token não valida?

```bash
# Testar endpoint manualmente
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://localhost:8000/api/users/me
```

### Socket.id não sincroniza?

Verificar se `saveGameState` e `updateGameHeartbeat` são chamados após atualizar `socketId`.

## Documentação Completa

Ver `AUTH_RECOVERY_FIX.md` para detalhes completos da implementação.