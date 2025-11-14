# Documentação do Sistema WebSocket - Bisca Game Platform

## Visão Geral

Este sistema WebSocket implementa um servidor multiplayer para o jogo de cartas Bisca, utilizando Socket.IO para comunicação em tempo real entre clientes e servidor. O sistema suporta tanto jogos single-player (contra bot) quanto multiplayer (dois jogadores humanos).

## Arquitetura do Sistema

### Estrutura de Diretórios

```
websockets/
├── config/                 # Configurações do sistema
├── core/                   # Classes principais e lógica de negócio
│   ├── CardClass.js        # Classe Card para representar cartas
│   ├── GameClass.js        # Classe Game para gerenciar estados de jogo
│   ├── errorHandler.js     # Sistema de tratamento de erros
│   └── gameRules.js        # Regras do jogo de Bisca
├── handlers/               # Manipuladores de eventos WebSocket
│   ├── connectionHandlers.js    # Gerenciamento de conexões
│   ├── gameHandlers.js          # Manipuladores de eventos de jogo
│   ├── gameManager.js           # Gerenciador de jogos ativos
│   ├── multiplayerHandlers.js   # Manipuladores para modo multiplayer
│   ├── protectedHandlers.js     # Handlers com proteção contra erros
│   └── singleplayer.js          # Lógica do bot para single-player
├── middleware/             # Middlewares para proteção e logging
├── tests/                  # Testes do sistema
└── logs/                   # Arquivos de log
```

### Componentes Principais

#### 1. GameManager
Gerencia a criação, armazenamento e remoção de jogos ativos.

**Funcionalidades:**
- Criação de novos jogos com IDs únicos
- Mapeamento de jogadores para jogos
- Limpeza de jogos inativos
- Listagem de jogos ativos

#### 2. Game Class
Representa o estado de um jogo individual de Bisca.

**Características:**
- Suporte para 1 ou 2 jogadores
- Distribuição automática de cartas
- Sistema de pontuação tradicional da Bisca
- Controle de turnos e temporizadores
- Sistema de "risca" (match scoring)

#### 3. Card Class
Representa uma carta individual do baralho.

**Propriedades:**
- Naipe (suit): Copas, Espadas, Ouros, Paus
- Valor: 1-7, 11-13 (Ás, 2-7, Valete, Dama, Rei)
- Pontos: Sistema de pontuação da Bisca
- Ordem: Para comparação de força das cartas

#### 4. Sistema de Proteção contra Erros
Implementa múltiplas camadas de proteção para garantir estabilidade.

**Funcionalidades:**
- Proteção de sockets individuais
- Backup automático de estados de jogo
- Recuperação automática de erros
- Logging detalhado de erros
- Monitoramento de saúde do sistema

## Eventos WebSocket

### Eventos de Conexão

#### `auth`
Autentica um jogador no sistema.

**Payload de entrada:**
```javascript
{
  playerName: string,
  additionalInfo?: object
}
```

**Resposta:**
```javascript
// Sucesso
{
  success: true,
  playerName: string,
  sessionId: string
}

// Erro
{
  success: false,
  error: string
}
```

#### `reconnect`
Reconecta um jogador após desconexão.

**Payload de entrada:**
```javascript
{
  playerName: string,
  sessionId: string
}
```

### Eventos de Jogo Single-Player

#### `startGame`
Inicia um novo jogo contra o bot.

**Payload de entrada:**
```javascript
{
  playerName: string,
  turnTime?: number (default: 30)
}
```

**Resposta:**
```javascript
{
  success: true,
  gameId: string,
  gameState: {
    playerHand: Card[],
    trumpCard: Card,
    trumpSuit: string,
    currentTurn: string,
    points: object,
    gameNumber: number
  }
}
```

#### `playCard`
Joga uma carta no jogo.

**Payload de entrada:**
```javascript
{
  player: string,
  card: {
    suit: string,
    value: number
  }
}
```

**Resposta:**
```javascript
{
  success: true,
  roundResult: {
    winner: string,
    cards: Card[],
    points: number
  },
  gameState: object
}
```

#### `botResponse`
Confirmação de jogada do bot (sistema interno).

### Eventos Multiplayer

#### `createRoom`
Cria uma nova sala multiplayer.

**Payload de entrada:**
```javascript
{
  roomName: string,
  isPrivate?: boolean,
  maxPlayers?: number,
  turnTime?: number
}
```

#### `joinRoom`
Entra em uma sala existente.

**Payload de entrada:**
```javascript
{
  roomId: string,
  password?: string
}
```

#### `startMultiplayerGame`
Inicia um jogo multiplayer na sala.

#### `multiplayerCardPlay`
Joga uma carta no modo multiplayer.

#### `leaveRoom`
Sai da sala atual.

#### `getRooms`
Lista salas disponíveis.

**Resposta:**
```javascript
{
  rooms: [{
    id: string,
    name: string,
    players: number,
    maxPlayers: number,
    isPrivate: boolean,
    status: string
  }]
}
```

### Eventos de Sistema

#### `getSystemHealth`
Obtém estatísticas de saúde do sistema.

**Resposta:**
```javascript
{
  uptime: number,
  activeGames: number,
  connectedClients: number,
  errorCount: number,
  memoryUsage: object
}
```

#### `getStats`
Obtém estatísticas gerais do servidor.

## Como Usar o Sistema

### 1. Configuração Inicial

```javascript
import { io } from "socket.io-client";

const socket = io("ws://localhost:3000", {
  transports: ["websocket", "polling"]
});
```

### 2. Autenticação

```javascript
socket.emit("auth", {
  playerName: "MeuNome",
  additionalInfo: { /* dados extras */ }
});

socket.on("authSuccess", (data) => {
  console.log("Autenticado:", data.playerName);
  // Salvar sessionId para reconexão
  localStorage.setItem("sessionId", data.sessionId);
});
```

### 3. Iniciar Jogo Single-Player

```javascript
socket.emit("startGame", {
  playerName: "MeuNome",
  turnTime: 30 // segundos
});

socket.on("gameStarted", (gameState) => {
  console.log("Jogo iniciado:", gameState);
  // Atualizar interface com as cartas na mão
  displayPlayerHand(gameState.playerHand);
  displayTrumpCard(gameState.trumpCard);
});
```

### 4. Jogar uma Carta

```javascript
socket.emit("playCard", {
  player: "MeuNome",
  card: {
    suit: "Copas",
    value: 7
  }
});

socket.on("roundResult", (result) => {
  console.log("Resultado da rodada:", result);
  // Atualizar pontuação e estado do jogo
});
```

### 5. Modo Multiplayer

```javascript
// Criar sala
socket.emit("createRoom", {
  roomName: "Minha Sala",
  isPrivate: false,
  turnTime: 45
});

// Listar salas
socket.emit("getRooms");
socket.on("roomsList", (data) => {
  console.log("Salas disponíveis:", data.rooms);
});

// Entrar numa sala
socket.emit("joinRoom", {
  roomId: "room-123"
});

socket.on("roomJoined", (roomData) => {
  console.log("Entrou na sala:", roomData);
});
```

### 6. Tratamento de Erros

```javascript
socket.on("error", (error) => {
  console.error("Erro do servidor:", error);
  // Mostrar mensagem de erro ao usuário
});

socket.on("gameError", (error) => {
  console.error("Erro no jogo:", error);
  // Tratar erro específico do jogo
});
```

### 7. Reconexão Automática

```javascript
socket.on("disconnect", () => {
  console.log("Desconectado do servidor");
  // Tentar reconectar
});

socket.on("connect", () => {
  // Tentar reconectar ao jogo anterior
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    socket.emit("reconnect", {
      playerName: "MeuNome",
      sessionId: sessionId
    });
  }
});
```

## Regras do Jogo de Bisca

### Objetivo
Fazer mais pontos que o adversário em uma partida de várias mãos.

### Distribuição
- Cada jogador recebe 9 cartas
- Uma carta é virada como trunfo
- O restante forma o monte

### Valores das Cartas
- Ás: 11 pontos
- 7: 10 pontos
- Rei: 4 pontos
- Dama: 3 pontos
- Valete: 2 pontos
- Outras cartas: 0 pontos

### Força das Cartas (da menor para maior)
2, 3, 4, 5, 6, Valete, Dama, Rei, 7, Ás

### Sistema de Pontuação da Partida
- Risca: Vencer uma mão (60+ pontos)
- Moca: Vencer uma mão com 90+ pontos (vale 2 riscas)
- Primeira partida a 4 riscas vence

## Configurações

### Arquivo config.js

```javascript
const config = {
  server: {
    port: 3000,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  },
  game: {
    defaultTurnTime: 30,
    cardsPerPlayer: 9,
    maxRetries: 3
  },
  bot: {
    thinkingTime: [1000, 3000], // ms
    confirmation: {
      enabled: true,
      responseTimeout: 5000,
      maxRetries: 2
    }
  },
  security: {
    errorProtection: true,
    autoRecovery: true,
    backupInterval: 30000
  }
};
```

## Monitoramento e Logs

### Logs do Sistema
- Conexões e desconexões
- Erros e recuperações
- Estatísticas de performance
- Estados de jogo para debug

### Métricas Disponíveis
- Número de jogos ativos
- Número de conexões
- Taxa de erros
- Tempo de resposta médio
- Uso de memória

## Testes

### Executar Testes

```bash
# Teste básico do sistema
npm test

# Teste do bot
npm run test:bot

# Teste de integração
npm run test:integration
```

### Tipos de Teste Disponíveis
- Distribuição de cartas
- Integridade do jogo
- Sistema de bot
- Proteção contra erros
- Multiplayer
- Reconexão

## Desenvolvimento e Debug

### Modo de Desenvolvimento

```bash
npm run dev  # Inicia com auto-reload
```

### Debug do Cliente

```javascript
// Ativar logs detalhados
localStorage.debug = 'socket.io-client:socket';

// Ouvir todos os eventos
socket.onAny((event, ...args) => {
  console.log(`Evento recebido: ${event}`, args);
});
```

### Verificação de Saúde

```javascript
socket.emit("getSystemHealth");
socket.on("systemHealth", (health) => {
  console.log("Saúde do sistema:", health);
});
```

## Considerações de Performance

### Otimizações Implementadas
- Pool de conexões eficiente
- Limpeza automática de sessões expiradas
- Backup assíncrono de estados
- Compressão de dados transmitidos
- Rate limiting para prevenir spam

### Limites Recomendados
- Máximo 100 jogos simultâneos
- Timeout de inatividade: 1 hora
- Máximo 10 tentativas de reconexão
- Buffer de mensagens: 1MB por cliente

## Troubleshooting

### Problemas Comuns

1. **Cliente não consegue conectar**
   - Verificar se o servidor está ativo na porta 3000
   - Verificar configurações de CORS
   - Testar com diferentes transports

2. **Jogo não inicia**
   - Verificar autenticação do jogador
   - Verificar se há jogos ativos em excesso
   - Consultar logs do servidor

3. **Bot não responde**
   - Verificar configurações do bot
   - Verificar se há erros na lógica de jogo
   - Reiniciar o sistema de confirmação do bot

4. **Desconexões frequentes**
   - Verificar estabilidade da rede
   - Ajustar timeout de reconexão
   - Verificar logs de erro do cliente

### Comandos de Debug

```bash
# Ver logs em tempo real
tail -f logs/websocket.log

# Verificar processos ativos
ps aux | grep node

# Testar conectividade
curl -I http://localhost:3000
```

## Contribuição

### Padrões de Código
- Usar ES6+ modules
- Documentar todas as funções públicas
- Incluir testes para novas funcionalidades
- Seguir padrões de naming consistentes

### Estrutura de Commits
```
tipo(escopo): descrição

feat(game): adicionar sistema de ranking
fix(bot): corrigir bug na seleção de cartas
docs(readme): atualizar documentação da API
```

### Pull Requests
- Incluir testes
- Atualizar documentação
- Verificar compatibilidade
- Testar em diferentes navegadores