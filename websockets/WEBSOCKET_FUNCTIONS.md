# WebSocket Functions & Events — Documentação Completa

Este documento descreve de forma exaustiva as funções, handlers e eventos WebSocket implementados na pasta `websockets/` do projeto Bisca. Foi criado para que você (desenvolvedor/integradore) entenda o fluxo de mensagens em tempo real entre cliente e servidor, os payloads esperados, e como reagir a cada evento.

Sumário
- Visão geral
- Arquitetura e arquivos principais
- Fluxo de mensagens (alto nível)
- Handlers / Funções principais (descrição detalhada)
- Eventos (cliente → servidor)
- Eventos (servidor → cliente)
- Estruturas de payload e convenções
- Sequências típicas de uso (cenários)
- Mecanismos de proteção e recuperação
- Recomendações para cliente (Android / Web)
- Troubleshooting e FAQ
- Histórico / mudanças

---

## Visão geral

O servidor WebSocket usa Socket.IO para comunicação em tempo real. Ele suporta:
- Jogos singleplayer (humano vs bot)
- Jogos multiplayer (2 jogadores humanos em uma sala)
- Reconexão de jogadores, timers por turno, auto-play em timeout
- Mecanismos avançados de proteção: backup de estado, recuperação automática, fallback handlers

Os eventos são organizados em dois grupos:
1. Eventos enviados pelo cliente para o servidor (comandos / requisições)
2. Eventos emitidos pelo servidor para os clientes (notificações de estado)

---

## Arquitetura e arquivos principais

Principais arquivos e responsabilidades (localizados em `websockets/`):

- `index.js`  
  Inicialização do servidor Socket.IO e registro dos eventos top-level (autenticação, iniciar jogo, jogar carta, salas etc). Liga handlers protegidos exportados em `protectedHandlers`.

- `core/GameClass.js`  
  Implementa `Game` (deck, `hands`, `trumpCard`, `playCard`, `getState()`, `dealCard`, `validatePlay`, timers internos).

- `core/CardClass.js`  
  Representa cartas e utilitários para transformar face/suit/rank.

- `core/gameRules.js`  
  Regras de jogo (validação de jogada, comparação de cartas, cálculo de pontos).

- `core/errorHandler.js`  
  Logger centralizado, `wrapHandler`, `safeEmit`, `safeEmitToRoom` e funções de coleta de estatísticas.

- `handlers/gameHandlers.js`  
  Lógica central de fluxo de jogo (jogadas, bot, resolução de rounds, deal após round, timers, recuperação).

- `handlers/multiplayerHandlers.js`  
  Fluxo específico para multiplayer: criação de sala, join/leave, sincronização entre dois jogadores humanos.

- `handlers/connectionHandlers.js`  
  Autenticação (`auth`), reconexão, gerenciamento de sessões e estatísticas de conexão.

- `handlers/gameManager.js`  
  `GameManager` — cria e armazena instâncias de `Game`, mapeia players → gameId.

- `handlers/protectedHandlers.js`  
  Envolve os handlers com proteções: backups, restauração, fallbacks (para prevenir crash e recuperar jogo).

- `middleware/socketProtection.js`  
  Proteções por socket (rate limiting, validações).

---

## Fluxo de mensagens (alto nível)

1. Cliente conecta (Socket.IO).
2. Cliente emite `auth` para se autenticar.
3. Cliente inicia jogo (`startSingleplayerGame` ou `startMultiplayerGame`).
4. Servidor cria `Game` via `GameManager`, chama `game.start()` e emite `gameStarted` com `state`.
5. Cliente exibe `hands` (ou `playerCards`) e aguarda turno.
6. Cliente emite `playCard` com `gameId`, `playerName` e `cardFace`.
7. Servidor processa `handleCardPlay` (protected), emite `cardPlayed` e atualiza estado:
   - Se singleplayer: chamará `handleBotTurn`, depois `resolveRound`.
   - Se multiplayer: chamará `handleMultiplayerCardPlay` e possivelmente `resolveRound`.
8. Servidor emite `roundResult`, `gameStateUpdate`, `roundEnded`, `gameEnded` conforme necessário.
9. Em caso de erro, `wrapHandler` envia `gameError` e protected handlers tentam recuperar estado. Se recuperado, emite `gameRecovered`/`gameStateUpdate`.

---

## Handlers / Funções principais (descrição detalhada)

A seguir descrevo as funções mais importantes e quando são acionadas. Use os nomes exatamente como aparecem nos arquivos para localizar o código.

- `GameManager.createGame(player1, player2 = null, turnTime)`  
  Cria um `Game` (ID único `game-<n>`), chama `game.start()`, popula `activeGames` e `playerGames`. Retorna `{ gameId, game }`.

- `Game.start()`  
  - Embaralha deck, define `trumpCard` / `trumpSuit`.  
  - Distribui cartas para os dois jogadores (`hands[p1]`, `hands[p2]` com faces/objetos `Card`).  
  - Inicializa `points`, `marks`, `currentTurn` e chama `startTimer()`.  
  - Retorna `getState()`.

- `Game.getState()`  
  - Retorna objeto JSON serializável com: `trump`, `hands` (map player → array de `face`), `remaining`, `currentTurn`, `points`, `marks`, `gameNumber`, `matchFinished`, etc.

- `gameHandlers.handleCardPlay(game, playerName, cardFace, io, gameId)`  
  - Valida vez e existência da carta na mão (`validatePlay`).  
  - Remove carta da mão, adiciona a `playedCards`.  
  - Atualiza `currentTurn` (p.ex. para bot).  
  - Emite `cardPlayed` via `io.to(gameId).emit("cardPlayed", { player, card, remainingCards })`.  
  - Retorna `{ success, playedCard }` ou `{ success: false, error }`.

- `gameHandlers.handleBotTurn(game, playerCard, io, gameId)`  
  - Decide a carta do bot (usa `botPlay`), remove do `botHand`, adiciona a `playedCards`.  
  - Emite `cardPlayed` (bot) e, se configurado, `botCardPlayed`.  
  - Retorna `{ success, botCard }`.

- `gameHandlers.resolveRound(game, card1, card2, player1, player2, io, gameId)`  
  - Compara cartas (`selectPlayWinner`), calcula pontos, atualiza `game.points`.  
  - Identifica vencedor, atualiza `game.currentTurn`.  
  - Repõe cartas (`dealCard`) quando o deck não estiver vazio; inclui `dealtCards` no payload caso haja novas cartas.  
  - Emite `roundResult` com `cards`, `winner`, `points`, `scores`, `nextTurn`, `dealtCards`.  
  - Emite `roundEnded`.  
  - Retorna resumo do round.

- `gameHandlers.handlePlayerTimeout(game, playerName, io, gameId)`  
  - Chamado quando `startPlayerTimer` expira.  
  - Marca perda por timeout, emite `playerTimeout`, `matchEnded`, `matchVictory` e retorna `{ success, gameEnded }`.

- `gameHandlers.attemptGameRecovery(game, gameId, io)`  
  - Quando detecta distribuição anômala, tenta redistribuir as cartas do deck para `hands`.  
  - Emite `gameRecovered` com `hands` atualizadas se a recuperação for feita.

- `protectedHandlers.backupGameState(gameId, game)`  
  - Serializa e armazena estado crítico do jogo (mãos, playedCards, deck, trump) em `this.gameStates`. Usado antes de operações arriscadas.

- `protectedHandlers.recoverGameFromError(gameId, game, io, error)`  
  - Reconstrói `game.hands`, `game.deck`, `playedCards` e reanima o fluxo (timers, bot) quando possível. Emite `gameRecovered` e `gameStateUpdate` se a restauração ocorrer.

- `errorHandler.wrapHandler(handlerName, handler)`  
  - Envolve handlers para capturar exceções, logar e enviar `gameError` ao cliente sem deixar o servidor falhar.

---

## Eventos (cliente → servidor)

Use os nomes de eventos conforme definido nas constantes do cliente (`GameConfig.SocketEvents`) — exemplos:

- `auth`  
  Payload: `{ playerName: string, additionalInfo?: object }`  
  Resposta esperada: `authSuccess` ou `authError`.

- `reconnect`  
  Payload: `{ playerName: string, gameId?: string }`

- `startSingleplayerGame`  
  Payload: `{ playerName: string, turnTime?: number }`  
  Resultado imediato: `gameStarted` contendo `state` (que inclui `hands`).

- `playCard`  
  Payload: `{ gameId: string, playerName: string, cardFace: string }`  
  Observações:
  - `cardFace` é a string que identifica a carta (ex.: `'c7'`, `'p1'` dependendo da convenção).
  - O servidor valida se é a vez do jogador e se a carta está na mão.

- `createRoom`, `joinRoom`, `startMultiplayerGame`, `leaveRoom`, `listRooms`, `getGameState`, `startNextGame`  
  Payloads variam — ver `multiplayerHandlers` e `index.js` para detalhes.

- `getSystemHealth`, `getErrorStats`, `getConnectionStats`  
  Para monitoramento/diagnóstico.

---

## Eventos (servidor → cliente)

Os eventos mais relevantes que o cliente ouve:

- `authSuccess` / `authError`  
- `gameStarted`  
  Payload: `{ gameId, state, players, isBot, gameType }`  
  - `state` inclui `hands` (quando é a estrutura `hands`) e/ou `playerCards` (estrutura alternativa). O cliente deve aceitar ambas.

- `cardPlayed`  
  Payload: `{ player, card, remainingCards, ... }`  
  - Indica que um jogador (ou bot) jogou uma carta. Cliente deve remover essa carta da sua UI.

- `botCardPlayed`  
  Payload: `{ card, remainingCards }`  
  - Mensagem específica para display do bot.

- `roundResult`  
  Payload: `{ cards: [{player,card}], winner, points, scores, nextTurn, dealtCards? }`  
  - `dealtCards` (opcional): mapa player→cardFace com cartas recebidas após a rodada; cliente deve adicionar essas cartas à mão.

- `roundEnded`  
  Payload: `{ winner, nextTurn }`

- `gameStateUpdate`  
  Payload: `{ state, lastPlay? }`  
  - `state` é `game.getState()` do servidor; pode conter `hands` ou outra estrutura. Use isto para sincronizar estado completo.

- `gameRecovered`  
  Payload: `{ message, hands }`  
  - Indica que o servidor corrigiu e reenviou as mãos (sincronização imediata necessária).

- `playerTimeout`  
  Payload: `{ player, winner, autoPlayedCard?, reason }`

- `turnTimerStarted` / `turnTimerUpdate`  
  Payload: `{ player, timeLimit, startTime }` / `{ player, timeRemaining }`

- `gameEnded` / `playerVictory` / `matchEnded` / `matchVictory`  
  Payloads com resumo final da partida.

- `gameError`  
  Payload: `{ message, recovered? }`  
  - Enviado por `wrapHandler` quando um handler lança erro. O cliente pode exibir alerta e aguardar `gameRecovered`.

---

## Estruturas de payload e convenções

- `gameId`: string no formato `game-<n>`.
- `cardFace`: string que representa a face da carta. Conveções internas podem variar; cliente deve usar o mesmo encoding que o servidor.
- `hands` (em `state`): object com chaves sendo playerNames e valores arrays de strings (faces), por exemplo: `{ "Alice": ["c7","p1","o4"], "Bot": ["e3","p12","c2"] }`.
- `dealtCards`: object player→cardFace (apenas quando cartas são distribuídas).
- `scores` / `points`: object player→number.
- `lastPlay`: `{ player, card }` — usada em `gameStateUpdate`.

---

## Sequências típicas de uso (cenários)

1. Início de jogo singleplayer
   - Cliente: `startSingleplayerGame` → Servidor: `gameStarted` com `state` → Cliente renderiza mão e trunfo.

2. Jogada humana seguida de bot
   - Cliente: `playCard` payload `{gameId, playerName, cardFace}`  
   - Servidor: valida → emite `cardPlayed` (player) → servidor executa `handleBotTurn` → emite `cardPlayed` (bot) e possivelmente `botCardPlayed` → servidor chama `resolveRound` → emite `roundResult` e `roundEnded` → servidor emite `gameStateUpdate` (state atualizado e `dealtCards` se houver).

3. Timeout do jogador
   - `startPlayerTimer` expira → `handlePlayerTimeout` → emite `playerTimeout` e encerra jogo/marca vitória se necessário.

4. Erro e recuperação
   - Qualquer handler envolve `wrapHandler` → em caso de erro, `gameError` emitido, `protectedHandlers` tentam recuperar a partir de backup → se recuperado, `gameRecovered` e `gameStateUpdate` são emitidos.

---

## Mecanismos de proteção e recuperação

- `wrapHandler`: evita crashes em handlers; ao capturar exceção envia `gameError` e retorna erro controlado ao chamador.
- Backups periódicos e pré-operação via `protectedHandlers.backupGameState` (serializa cartas e estado essencial).
- `reconstructCards` e `recoverGameFromError` para recriar objetos carta simples quando necessário.
- Fallbacks:
  - `createFallbackBotPlay`: se bot falhar, faz jogada de emergência para manter fluxo.
  - `safeAutoPlay`: em caso de timeout/erro, joga a primeira carta disponível.
  - `safeFallbackRoundResolution`: resolve rodada com regra simplificada se `resolveRound` falhar.
- Emissões seguras: `safeEmit` e `safeEmitToRoom` para não lançar por sockets desconectados.

---

## Recomendações para o cliente (Android / Web)

- Sempre trate tanto `state.hands` quanto `state.playerCards`. O cliente Android já possui parsing robusto (`parseGameState`) com fallback entre `playerCards` e `hands`.
- Não confie apenas em `cardPlayed` para atualizar a mão; sincronize periodicamente com `gameStateUpdate` ou chame `getGameState` quando suspeitar de dessincronização.
- Ao receber `roundResult.dealtCards`, adicione as cartas recebidas à mão local.
- Mostre timers com base em `turnTimerStarted` / `turnTimerUpdate`, não localmente só pelo timer do cliente; servidor é a fonte de verdade.
- Ao receber `gameError`, mostre uma notificação ao jogador, aguarde `gameRecovered`/`gameStateUpdate` antes de permitir novas ações.
- Em reconexão (`reconnect`), enviar `playerName` e (se disponível) `gameId` para tentar retomar o jogo atual. O servidor tentará reentrar o jogador na sala correta e reenviar `gameState`.

---

## Troubleshooting (problemas comuns)

- "O cliente não recebe as cartas ao iniciar":
  - Verifique que o `gameStarted` está a ser emitido com `state` contendo `hands` (o servidor usa `game.getState()`).
  - No cliente, valide se o parser procura `hands` e `playerCards`.
- "Carta jogada localmente não some da UI":
  - Confirme que você está escutando `cardPlayed` e que, quando o jogador é você, você remove a carta localmente. Em caso de dúvida, aguarde `gameStateUpdate`.
- "DealtCards não aparecem":
  - `roundResult` pode incluir `dealtCards`. O cliente deve adicionar estas cartas ao array da mão.
- "Bot não joga":
  - Verifique logs do servidor (`bot` configurado, `bot.confirmation.enabled`, timers).
- "Desincronização após reconexão":
  - Chame `getGameState` no servidor; use o payload para substituir o estado local.

---

## FAQ

- Qual evento contém as cartas do jogador?  
  - `gameStarted` (via `state`), `gameStateUpdate` (via `state`) e `gameRecovered` (quando servidor faz redistribuição). Também `roundResult.dealtCards` fornece cartas repostas.

- O servidor sempre envia objetos `hands` com faces de cartas?  
  - Sim: `Game.getState()` retorna `hands` como um mapa player→array de faces. Clientes também aceitam `playerCards` como estrutura alternativa (compatibilidade).

- Como detectar se é a minha vez?  
  - Verifique `state.currentTurn` (ou `currentPlayer`) e status de `tableCards` / `playedCards`. Clientes devem aplicar a lógica: se `currentTurn === yourName` e `tableCards` indica que você precisa jogar, habilite UI de jogar carta.

---

## Histórico / mudanças
- Versão inicial: documentação criada cobrindo todos os handlers e eventos principais.
- Recomenda-se manter este arquivo sincronizado com alterações em `websockets/` (handlers e nomes de eventos).

---

Se quiser, eu posso:
- Gerar exemplos JSON prontos para cada evento com o formato exato de payload,
- Gerar snippets de cliente (Android Kotlin / JavaScript) mostrando como escutar e reagir a cada evento,
- Comparar a implementação real no código e atualizar este documento com os nomes exatos das constantes.

Diz-me qual opção prefere que eu produza para complementar este ficheiro.