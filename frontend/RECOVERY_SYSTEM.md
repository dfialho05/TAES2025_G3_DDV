# Sistema de Recuperação de Estado e Resiliência WebSocket

## Visão Geral

Este documento descreve o sistema de recuperação de estado e resiliência implementado no frontend da aplicação Bisca Game. O sistema garante que os utilizadores possam continuar os seus jogos mesmo após perda de conexão, recarregamento de página ou falhas temporárias do servidor.

## Componentes Principais

### 1. BiscaStore (`stores/biscaStore.js`)

#### Estados Adicionados

- `isRecovering`: Indica se o jogo está em processo de recuperação
- `connectionLost`: Sinaliza perda de conexão durante um jogo ativo
- `showAnnulledModal`: Controla exibição do modal de jogo anulado
- `annulledReason`: Armazena motivo da anulação
- `annulledMessage`: Mensagem personalizada de anulação

#### Persistência de Estado

```javascript
persistGameState()
```
Guarda o estado crítico do jogo no localStorage:
- ID do jogo
- Lado do jogador (player1/player2)
- Modo de jogo (3 ou 9 cartas)
- Objetivo (número de vitórias necessárias)
- Timestamp para expiração

**Tempo de Expiração**: 5 minutos (300.000ms)

```javascript
loadPersistedState()
```
Recupera o estado guardado e valida o tempo de expiração.

```javascript
clearPersistedState()
```
Remove o estado guardado do localStorage.

#### Recuperação Automática

```javascript
attemptRecovery()
```
Tenta reconectar ao jogo usando o estado persistido:
1. Carrega estado do localStorage
2. Valida expiração (5 minutos)
3. Emite evento `join-game` via socket
4. Define timeout de 5 segundos para recuperação
5. Limpa estado se falhar

#### Watchers Implementados

**Watcher de gameID**
- Persiste estado automaticamente quando jogo inicia
- Limpa estado quando jogo termina

**Watcher de Conexão**
- Detecta perda de conexão durante jogo ativo
- Inicia recuperação automática ao reconectar

### 2. SocketStore (`stores/socket.js`)

#### Estados de Reconexão

- `isReconnecting`: Indica tentativa de reconexão em progresso
- `reconnectAttempts`: Contador de tentativas (máximo 10)

#### Configuração Socket.io

```javascript
{
  auth: { token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  withCredentials: true
}
```

#### Eventos de Reconexão

**`reconnect_attempt`**
- Dispara a cada tentativa
- Atualiza contador de tentativas
- Define estado `isReconnecting`

**`reconnect`**
- Sucesso na reconexão
- Reenvia identidade do utilizador
- Tenta reentrar no jogo ativo

**`reconnect_error`**
- Log de erros durante reconexão

**`reconnect_failed`**
- Após todas tentativas falharem
- Limpa estado do jogo
- Reset completo

**`disconnect`**
- Detecta razão da desconexão
- Auto-reconecta se servidor forçou desconexão

#### Eventos de Anulação

**`game_annulled`**
- Servidor anuló o jogo
- Exibe modal informativo
- Devolve moedas ao utilizador
- Limpa estado

**`game_timeout`**
- Jogo expirou por inatividade
- Comportamento similar a `game_annulled`

### 3. AuthStore (`stores/auth.js`)

#### Refresh de Token

```javascript
refreshToken()
```
- Previne múltiplas tentativas simultâneas
- Chama endpoint `/api/token` para novo token
- Atualiza localStorage
- Limpa sessão se falhar

### 4. Componente ConnectionStatus

**Localização**: `components/game/ConnectionStatus.vue`

Exibe notificação visual do estado da conexão:

**Estados Visuais**:
- Azul: A recuperar jogo ou a reconectar
- Vermelho: Desconectado ou conexão perdida
- Verde: Conectado (oculto automaticamente)

**Informações Exibidas**:
- Mensagem de estado
- Contador de tentativas de reconexão
- Animação de loading

### 5. Componente GameAnnulledModal

**Localização**: `components/game/GameAnnulledModal.vue`

Modal informativo exibido quando jogo é anulado:

**Informações**:
- Mensagem principal
- Motivo da anulação
- Confirmação de devolução de moedas
- Botão para retornar ao lobby

### 6. Composable useGameRecovery

**Localização**: `composables/useGameRecovery.js`

Centraliza lógica de recuperação reutilizável.

#### Funções Principais

**`attemptRecovery()`**
- Valida estado persistido
- Verifica conexão socket
- Executa recuperação

**`setupRecoveryWatchers()`**
- Configura watchers para reconexão automática
- Monitora mudanças no gameID

**`handlePageReload()`**
- Detecta recarregamento de página
- Inicia recuperação com timeout de 5s
- Retorna sucesso/falha da operação

**`cleanup()`**
- Limpa timeouts e watchers
- Executado em onBeforeUnmount

### 7. Interceptor Axios (main.js)

#### Interceptor de Resposta

Trata automaticamente tokens expirados (401):

1. Detecta resposta 401 com mensagem "Token expired"
2. Previne múltiplas tentativas simultâneas
3. Chama `authStore.refreshToken()`
4. Reexecuta pedidos falhados com novo token
5. Mantém fila de pedidos pendentes

```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && 
        error.response?.data?.message === 'Token expired') {
      // Lógica de refresh
    }
    return Promise.reject(error)
  }
)
```

## Fluxo de Recuperação

### Cenário 1: Perda de Conexão Durante Jogo

1. Socket desconecta
2. `connectionLost` = true
3. UI exibe "Conexão perdida. A reconectar..."
4. Socket.io tenta reconectar automaticamente
5. Ao reconectar: `reconnect` event
6. Reenvia identidade (`announceUser`)
7. Emite `join-game` com gameID persistido
8. Servidor retorna estado atualizado
9. `connectionLost` = false
10. Jogo continua normalmente

### Cenário 2: Recarregamento de Página

1. Página carrega
2. `handlePageReload()` executado
3. Carrega estado do localStorage
4. Valida expiração (5 minutos)
5. Aguarda conexão socket (timeout 5s)
6. Emite `join-game`
7. Servidor valida sessão no Redis
8. Retorna estado completo
9. UI renderiza estado recuperado

### Cenário 3: Servidor Timeout/Anulação

1. Servidor detecta inatividade (Redis TTL expirado)
2. Emite evento `game_annulled` ou `game_timeout`
3. Frontend recebe evento
4. `showAnnulledModal` = true
5. Modal exibe mensagem e motivo
6. Moedas devolvidas (servidor)
7. Utilizador clica "Entendido"
8. `resetGameState()` executado
9. Redirecionamento ao lobby

### Cenário 4: Falha Total de Reconexão

1. 10 tentativas de reconexão falham
2. Evento `reconnect_failed`
3. `resetGameState()` automático
4. Estado limpo do localStorage
5. UI retorna ao estado inicial

## Configurações e Timeouts

| Item | Valor | Descrição |
|------|-------|-----------|
| Expiração Estado | 5 min | Tempo máximo para recuperar jogo |
| Timeout Recuperação | 5 seg | Espera por resposta do servidor |
| Tentativas Reconexão | 10 | Máximo de tentativas socket |
| Delay Reconexão | 1-5 seg | Intervalo entre tentativas |
| Timeout Página | 5 seg | Espera por conexão após reload |

## Boas Práticas Implementadas

### 1. Persistência Selectiva
Apenas dados críticos são guardados no localStorage para minimizar overhead.

### 2. Validação de Expiração
Estado antigo é automaticamente descartado para evitar inconsistências.

### 3. Prevenção de Race Conditions
- Flag `isRefreshingApiToken` previne múltiplos refreshes
- Flag `isRefreshingToken` no authStore
- Fila de pedidos pendentes durante refresh

### 4. Feedback Visual Contínuo
Utilizador sempre informado do estado da conexão e recuperação.

### 5. Limpeza Automática
Estados temporários limpos automaticamente em unmount e erros.

### 6. Timeout Defensivo
Todos processos assíncronos têm timeout para prevenir travamentos.

### 7. Logging Estruturado
Todas operações logadas com prefixo identificador para debug.

## Integração com Backend

### Endpoints Esperados

**POST /api/token**
- Cria novo token API usando sessão existente
- Retorna: `{ token: "..." }`

**Socket Event: join-game**
- Payload: `gameID`
- Reativa jogo do Redis se válido
- Retorna estado completo via `game_state`

**Socket Event: game_annulled**
- Payload: `{ message, reason, refunded }`
- Notifica anulação de jogo
- Confirma devolução de moedas

**Socket Event: game_timeout**
- Similar a `game_annulled`
- Específico para timeouts

### Validações Backend Necessárias

1. Verificar sessão válida ao reconectar
2. Validar token API antes de operações
3. Manter estado de jogo no Redis com TTL
4. Devolver moedas ao anular jogo
5. Emitir eventos apropriados de anulação

## Testes Recomendados

### Teste 1: Perda de Conexão
1. Iniciar jogo
2. Desconectar rede
3. Reconectar rede
4. Verificar recuperação automática

### Teste 2: Recarregamento
1. Iniciar jogo
2. F5 (recarregar página)
3. Verificar jogo continua

### Teste 3: Timeout Servidor
1. Iniciar jogo
2. Ficar inativo > tempo Redis
3. Verificar modal de anulação
4. Confirmar moedas devolvidas

### Teste 4: Token Expirado
1. Esperar token expirar
2. Fazer ação que requer API
3. Verificar refresh automático
4. Ação completar com sucesso

### Teste 5: Falha Completa
1. Desligar servidor socket
2. Aguardar 10 tentativas falhas
3. Verificar limpeza de estado
4. Verificar UI retorna ao normal

## Troubleshooting

### Jogo não recupera após reconexão

**Possíveis causas**:
- Estado expirou (>5 min)
- Redis limpou dados
- Token inválido
- gameID não existe mais

**Solução**: Verificar logs do navegador e servidor

### Modal de anulação não aparece

**Possíveis causas**:
- Evento não emitido pelo servidor
- Listener não registado
- Store não actualizada

**Solução**: Verificar `setupListeners()` no socketStore

### Múltiplos refresh de token

**Possíveis causas**:
- Flag `isRefreshingApiToken` não funciona
- Múltiplos pedidos simultâneos

**Solução**: Verificar interceptor no main.js

## Manutenção Futura

### Melhorias Potenciais

1. **Persistência no IndexedDB**: Para dados maiores
2. **Sincronização Cross-Tab**: Múltiplas abas do jogo
3. **Modo Offline**: Cache local de movimentos
4. **Retry Exponential Backoff**: Melhor estratégia de reconexão
5. **Health Check**: Ping periódico ao servidor
6. **Métricas**: Tracking de taxa de recuperação

### Manutenção Regular

- Revisar timeouts conforme análise de uso
- Ajustar TTL do Redis baseado em dados reais
- Monitorar logs de falhas de recuperação
- Atualizar mensagens de erro conforme feedback

## Conclusão

O sistema de recuperação implementado fornece uma experiência robusta e sem interrupções para os utilizadores, tratando automaticamente a maioria dos cenários de falha de conexão e garantindo que o progresso do jogo nunca seja perdido injustamente.