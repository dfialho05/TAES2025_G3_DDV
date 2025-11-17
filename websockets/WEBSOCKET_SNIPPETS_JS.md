# WebSocket Snippets (JavaScript)

Este ficheiro contém snippets práticos em JavaScript para usar os WebSockets do servidor (Socket.IO) implementado em `websockets/`. Os exemplos cobrem:

- Conexão básica com Socket.IO
- Autenticação (`auth`)
- Iniciar jogo singleplayer
- Jogar carta (`playCard`)
- Escutar eventos do servidor (`cardPlayed`, `roundResult`, `gameStateUpdate`, etc.)
- Parsing do `state` (compatibilidade `hands` / `playerCards`)
- Reconexão e recuperação
- Multiplayer: criar/sair/entrar em salas
- Requisições de diagnóstico (`getSystemHealth`, `getGameState`)
- Boas práticas para sincronização de mão e tratamento de `dealtCards`

Eu proponho os exemplos usando `socket.io-client`. Adapte os nomes dos eventos se tiveres constantes no cliente.

---

## 1) Instalação (Node / Browser bundler)

Instala o cliente Socket.IO:

```/dev/null/install.md#L1-5
# Em Node (ou bundlers como webpack/parcel)
npm install socket.io-client
```

---

## 2) Conexão básica (reconexão automática)

```/dev/null/connection.js#L1-80
// Import (Node / bundler)
import { io } from "socket.io-client";

// URL do servidor (atualiza com o teu endereço)
const SERVER_URL = "http://localhost:3000";

// Opções recomendadas
const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  autoConnect: true,
});

// Eventos de vida da conexão
socket.on("connect", () => {
  console.log("Conectado ao servidor (id):", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Desconectado:", reason);
});

socket.on("connect_error", (err) => {
  console.error("Erro de conexão:", err.message);
});
```

---

## 3) Autenticação (`auth`)

Envias um evento `auth` com `playerName`. O servidor responde com `authSuccess` ou `authError`.

```/dev/null/auth.js#L1-80
// Supondo que 'socket' já está conectado
function authenticate(playerName, extra = {}) {
  socket.emit("auth", { playerName, additionalInfo: extra });

  socket.once("authSuccess", (data) => {
    console.log("Autenticado:", data.playerName);
    // Guarda session info se necessário
    // localStorage.setItem("session", JSON.stringify(data.sessionInfo));
  });

  socket.once("authError", (err) => {
    console.error("Falha de autenticação:", err.message || err);
  });
}
```

---

## 4) Iniciar jogo singleplayer

```/dev/null/startSingle.js#L1-60
function startSingleplayer(playerName, turnTime = 30) {
  socket.emit("startSingleplayerGame", { playerName, turnTime });

  socket.once("gameStarted", (payload) => {
    console.log("Jogo iniciado:", payload.gameId, payload);
    // payload.state === game.getState() do servidor
    // Exibe a mão do jogador usando parseGameState abaixo
    const state = payload.state;
    const parsed = parseGameState(state, playerName);
    updateUIWithGameState(parsed);
  });
}
```

---

## 5) Jogar uma carta (`playCard`)

O servidor espera `{ gameId, playerName, cardFace }`. Usa o formato `cardFace` que o servidor utiliza (ex.: `"c7"`, dependendo das convenções do projeto).

```/dev/null/playCard.js#L1-80
function playCard(gameId, playerName, cardFace) {
  if (!gameId || !playerName || !cardFace) {
    console.warn("Parâmetros inválidos para playCard");
    return;
  }

  const payload = { gameId, playerName, cardFace };
  socket.emit("playCard", payload);
  // Pode haver confirmação via 'gameError' ou via evento 'cardPlayed' / 'gameStateUpdate'
}
```

---

## 6) Escutar eventos importantes do servidor

```/dev/null/listeners.js#L1-200
// cardPlayed -> atualizar a mesa e remover da mão local
socket.on("cardPlayed", (data) => {
  // Ex: { player: "Alice", card: "c7", remainingCards: 2 }
  console.log("cardPlayed:", data);
  handleCardPlayedEvent(data);
});

// botCardPlayed -> display específico do bot
socket.on("botCardPlayed", (data) => {
  console.log("Bot jogou:", data);
  showBotCard(data);
});

// roundResult -> receber dealtCards e scores
socket.on("roundResult", (result) => {
  // Ex: { cards: [{player,card},{...}], winner, points, scores, nextTurn, dealtCards }
  console.log("roundResult:", result);
  applyRoundResultToUI(result);
  if (result.dealtCards) {
    // result.dealtCards é um mapa player->cardFace
    applyDealtCardsToLocalHands(result.dealtCards);
  }
});

// gameStateUpdate -> sincronização completa de estado
socket.on("gameStateUpdate", (payload) => {
  // Payload: { state: game.getState(), lastPlay: {...} }
  console.log("gameStateUpdate", payload);
  const state = payload.state;
  const parsed = parseGameState(state, myPlayerName);
  replaceLocalState(parsed);
});

// gameRecovered -> servidor corrigiu distribuição
socket.on("gameRecovered", (data) => {
  console.warn("Jogo recuperado:", data);
  // data.hands pode conter todas as mãos — sincroniza
  if (data.hands) {
    replaceHandsFromServer(data.hands);
  }
});

// gameError -> handler central para erros recuperáveis
socket.on("gameError", (err) => {
  console.error("Erro do jogo:", err);
  // Mostrar alerta ao jogador; aguardar gameRecovered / gameStateUpdate
});
```

---

## 7) Parser robusto do `state` recebido

O servidor pode enviar `state` com diferentes propriedades: `hands` (map player→array faces) ou um `playerCards` específico. O snippet abaixo mostra como extrair a mão do jogador e os `tableCards`.

```/dev/null/parseGameState.js#L1-220
/**
 * parseGameState(state, myPlayerName)
 * - state: objeto recebido do servidor (game.getState())
 * - myPlayerName: string (nome do jogador local)
 *
 * Retorna:
 * {
 *  trump,
 *  trumpCard,
 *  playerCards: Array<CardFaceString>,
 *  tableCards: Map player->cardFace,
 *  currentTurn,
 *  scores,
 *  deckSize,
 *  rawState
 * }
 */
function parseGameState(state, myPlayerName) {
  if (!state) return null;

  const result = {
    trump: state.trump || "",
    trumpCard: state.trumpCard || null,
    playerCards: [],
    tableCards: {},
    currentTurn: state.currentTurn || state.currentPlayer || null,
    scores: state.scores || state.points || {},
    deckSize: state.remaining || state.deckSize || 0,
    rawState: state,
  };

  // 1) Prefer explicit 'playerCards' (nova estrutura)
  if (state.playerCards && Array.isArray(state.playerCards)) {
    result.playerCards = [...state.playerCards];
  } else if (state.hands && typeof state.hands === "object") {
    // 2) Estrutura 'hands' : encontrar a mão do jogador (ignorar bot)
    // O servidor envia hands = { "Alice": ["c7","..."], "Bot": ["..."] }
    for (const [player, arr] of Object.entries(state.hands)) {
      if (player === myPlayerName) {
        result.playerCards = Array.isArray(arr) ? [...arr] : [];
        break;
      }
    }
  } else {
    // fallback: procurar por chaves comuns
    if (state.player && Array.isArray(state.player)) {
      result.playerCards = [...state.player];
    }
  }

  // tableCards: pode vir como 'tableCards' no state
  if (state.tableCards && typeof state.tableCards === "object") {
    result.tableCards = { ...state.tableCards };
  } else if (state.playedCards && Array.isArray(state.playedCards)) {
    // playedCards é um array de { player, card }
    for (const p of state.playedCards) {
      if (p && p.player && p.card) {
        result.tableCards[p.player] = p.card;
      }
    }
  }

  return result;
}
```

---

## 8) Aplicar `dealtCards` (cartas recebidas após round)

Quando o servidor devolve `roundResult.dealtCards` é importante concatenar a nova carta à mão do jogador local.

```/dev/null/applyDealtCards.js#L1-80
function applyDealtCardsToLocalHands(dealtCards) {
  // dealtCards: { "Alice": "c7", "Bot": "p1" }
  if (!dealtCards) return;

  // Exemplo: se tens um state local com playerCards
  const myCardFromServer = dealtCards[myPlayerName];
  if (myCardFromServer) {
    // Adiciona à mão local
    localState.playerCards.push(myCardFromServer);
    updateHandUI(localState.playerCards);
  }

  // Se geres mãos inteiras por jogador (spectator/admin), atualiza conforme necessário
}
```

---

## 9) Requisição explícita de estado (`getGameState`)

Se suspeitares de dessíncronização, pede o estado actual:

```/dev/null/getGameState.js#L1-40
function requestGameState(gameId) {
  socket.emit("getGameState", { gameId });

  socket.once("gameStateResponse", (resp) => {
    // resp: { state, stats, timestamp }
    console.log("gameStateResponse:", resp);
    const parsed = parseGameState(resp.state, myPlayerName);
    replaceLocalState(parsed);
  });
}
```

---

## 10) Multiplayer — criar/juntar sala

```/dev/null/multiplayer.js#L1-140
// Criar sala
function createRoom(playerName, roomOptions = {}) {
  socket.emit("createRoom", { playerName, roomOptions });

  socket.once("roomCreated", (data) => {
    // Ex: { gameId, roomInfo }
    console.log("Sala criada:", data.gameId, data.roomInfo);
    // Junta automaticamente
    // socket.join é server-side — do cliente, usa socket.emit('joinRoom', ...)
  });
}

// Entrar em sala
function joinRoom(gameId, playerName, password = null) {
  socket.emit("joinRoom", { gameId, playerName, password });

  socket.once("roomJoined", (resp) => {
    console.log("Entrou na sala:", resp);
  });

  socket.on("roomError", (err) => {
    console.error("Erro na sala:", err);
  });
}

// Iniciar jogo multiplayer (por quem tem permissão)
function startMultiplayerGame(gameId, playerName) {
  socket.emit("startMultiplayerGame", { gameId, playerName });
  // Depois, aguarda 'gameStarted' emitido pelo servidor para quem está na sala
}
```

---

## 11) Requisições de diagnóstico / admin

```/dev/null/diagnostics.js#L1-80
function checkSystemHealth() {
  socket.emit("getSystemHealth");
  socket.once("systemHealthResponse", (health) => {
    console.log("Saúde do sistema:", health);
  });
}

function getErrorStats(adminKey = "admin123") {
  socket.emit("getErrorStats", { adminKey });
  socket.once("errorStatsResponse", (stats) => {
    console.log("Error stats:", stats);
  });
}
```

---

## 12) Boas práticas e sugestões para integrar com UI

- Calcula a fonte de verdade: confiável é o servidor. Quando receberes `gameStateUpdate`, substitui o estado local para evitar dessíncronizações acumuladas.
- Mostra feedback imediado: ao enviar `playCard`, podes optimistamente remover a carta da UI, mas mantém um rollback se receberes `gameError`.
- Usa `once` para handlers de resposta única (ex.: `gameStarted`, `gameStateResponse`) e `on` para eventos contínuos (`cardPlayed`, `roundResult`).
- Em reconexão, tenta reenviar `auth` e `reconnect` com a `sessionInfo` (se armazenada). Depois pede `getGameState`.
- Loga os eventos cronometrados para diagnóstico: `cardPlayed` vs `gameStateUpdate` latency.

---

## 13) Exemplo completo — fluxo de jogar carta (simplificado)

```/dev/null/flow_play_card.js#L1-220
// 1) Usuário clica numa carta -> chama playCard(...)
function onUserPlayCard(cardFace) {
  // UI: desabilita temporariamente seleção
  disableCardSelection();

  // Otimistic update (remover localmente)
  optimisticRemoveCardFromUI(cardFace);

  // 2) Emite evento
  playCard(currentGameId, myPlayerName, cardFace);

  // 3) Espera confirmações / erros
  const errorTimeout = setTimeout(() => {
    // Se não houver resposta após X ms, pede estado ao servidor
    console.warn("Sem resposta, solicitando estado...");
    requestGameState(currentGameId);
    enableCardSelection();
  }, 3000);

  // Se chegar um gameError específico à jogada
  socket.once("gameError", (err) => {
    clearTimeout(errorTimeout);
    console.error("Erro na jogada:", err);
    // Rollback optimista caso necessário
    rollbackOptimisticRemoval(cardFace);
    enableCardSelection();
  });

  // Quando receber cardPlayed ou gameStateUpdate, limpa o timeout e actualiza UI
  const onCardPlayed = (data) => {
    if (data.player === myPlayerName && data.card === cardFace) {
      clearTimeout(errorTimeout);
      // A UI já foi atualizada optimisticamente, mas podes garantir consistência pedindo getGameState
      requestGameState(currentGameId);
      enableCardSelection();
      socket.off("cardPlayed", onCardPlayed);
    }
  };

  socket.on("cardPlayed", onCardPlayed);
}
```

---

## Conclusão

Estes snippets cobrem a maioria dos fluxos que irás precisar para integrar o cliente JS com o servidor WebSocket do projeto. Se quiseres, eu posso:

- Gerar uma versão TypeScript dos snippets.
- Criar exemplos React/Vue/Vanilla para UI (com hooks/composables).
- Gerar testes de integração (mochajs/jest) que simulam sequências (start → play → roundResult).

Diz-me qual preferes que eu gere a seguir.