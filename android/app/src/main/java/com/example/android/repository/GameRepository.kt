package com.example.android.repository

import android.util.Log
import com.example.android.data.*
import com.example.android.utils.GameConfig
import com.example.android.utils.Logger
import com.example.android.utils.TrumpCardDebug
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject
import java.net.URI

/**
 * Repository for managing WebSocket communication with the Bisca game server
 * Based on the Socket.IO events from game.html
 */
class GameRepository {
    private var socket: Socket? = null
    private val serverUrl = GameConfig.getServerUrlForDevice()

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    private val _gameState = MutableStateFlow(GameState())
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private val _gameLog = MutableStateFlow<List<GameLogEntry>>(emptyList())
    val gameLog: StateFlow<List<GameLogEntry>> = _gameLog.asStateFlow()

    private var currentPlayerName = ""

    companion object {
        private const val TAG = "GameRepository"
    }

    /**
     * Connect to the server and authenticate
     */
    suspend fun connect(playerName: String): Flow<Boolean> = callbackFlow {
        try {
            _connectionStatus.value = ConnectionStatus.CONNECTING
            addLogEntry("Conectando ao servidor...", LogType.INFO)
            Logger.networkEvent("Tentando conectar ao servidor: $serverUrl")

            val options = IO.Options().apply {
                transports = arrayOf("websocket", "polling")
                upgrade = true
                rememberUpgrade = true
                timeout = GameConfig.CONNECTION_TIMEOUT.toLong()
                reconnection = true
                reconnectionAttempts = 3
                reconnectionDelay = 2000
                forceNew = false
            }

            socket = IO.socket(URI.create(serverUrl), options)

            socket?.let { socket ->
                // Connection events
                socket.on(Socket.EVENT_CONNECT) {
                    Logger.networkEvent("Conectado ao servidor")
                    addLogEntry("Conectado! Fazendo autenticação...", LogType.INFO)

                    // Send authentication
                    val authData = JSONObject().apply {
                        put("playerName", playerName)
                    }
                    socket.emit(GameConfig.SocketEvents.AUTH, authData)
                }

                socket.on(GameConfig.SocketEvents.AUTH_SUCCESS) { args ->
                    if (args.isNotEmpty()) {
                        val data = args[0] as JSONObject
                        val authenticatedName = data.getString("playerName")
                        currentPlayerName = authenticatedName

                        _connectionStatus.value = ConnectionStatus.AUTHENTICATED
                        addLogEntry("Autenticado como: $authenticatedName", LogType.SUCCESS)
                        Logger.gameEvent("Jogador autenticado: $authenticatedName")

                        trySend(true)
                    }
                }

                socket.on(GameConfig.SocketEvents.AUTH_ERROR) { args ->
                    if (args.isNotEmpty()) {
                        val error = args[0] as JSONObject
                        val message = error.getString("message")

                        _connectionStatus.value = ConnectionStatus.ERROR
                        addLogEntry("Erro: $message", LogType.ERROR)
                        Logger.e("Erro de autenticação: $message")

                        trySend(false)
                    }
                }

                // Game events
                setupGameEventListeners(socket)

                socket.on(Socket.EVENT_DISCONNECT) {
                    Logger.networkEvent("Desconectado do servidor")
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                    addLogEntry("Desconectado do servidor", LogType.WARNING)
                }

                socket.on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Logger.e("Erro de conexão: ${args.contentToString()}")
                    _connectionStatus.value = ConnectionStatus.ERROR
                    addLogEntry("Erro de conexão", LogType.ERROR)
                    trySend(false)
                }

                socket.connect()
            }

        } catch (e: Exception) {
            Logger.e("Falha na conexão", throwable = e)
            _connectionStatus.value = ConnectionStatus.ERROR
            addLogEntry("Falha na conexão: ${e.message}", LogType.ERROR)
            trySend(false)
        }

        awaitClose {
            socket?.disconnect()
        }
    }

    private fun setupGameEventListeners(socket: Socket) {
        socket.on(GameConfig.SocketEvents.GAME_STARTED) { args ->
            if (args.isNotEmpty()) {
                val gameData = args[0] as JSONObject
                val gameId = gameData.getString("gameId")
                val gameState = gameData.getJSONObject("state")

                Log.d(TAG, "GAME_STARTED event received")
                Log.d(TAG, "Game ID: $gameId")
                Log.d(TAG, "Game state JSON: $gameState")

                val newGameState = parseGameState(gameState).copy(
                    gameId = gameId,
                    isGameStarted = true
                )

                _gameState.value = newGameState
                _connectionStatus.value = ConnectionStatus.IN_GAME

                addLogEntry("Jogo iniciado! ID: $gameId", LogType.SUCCESS)
                addLogEntry("Trunfo: ${newGameState.trump}", LogType.INFO)
                addLogEntry("Cartas na mão: ${newGameState.playerCards.size}", LogType.INFO)
                Logger.gameEvent("Jogo iniciado - ID: $gameId, Trunfo: ${newGameState.trump}")
                Log.d(TAG, "Game state updated with ${newGameState.playerCards.size} player cards")
            }
        }

        socket.on(GameConfig.SocketEvents.CARD_PLAYED) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val player = data.getString("player")
                val cardFace = data.getString("card")

                Log.d(TAG, "CARD_PLAYED event: player=$player, card=$cardFace")

                val card = Card.fromFace(cardFace)
                val currentState = _gameState.value
                val playerName = getCurrentPlayerName()

                // Update player cards if it's our card
                val updatedPlayerCards = if (player == playerName) {
                    currentState.playerCards.filter { it.face != cardFace }
                } else {
                    currentState.playerCards
                }

                // Update table cards
                val updatedTableCards = currentState.tableCards.toMutableMap()
                updatedTableCards[player] = card

                // Determine if it's player's turn after this card play
                val isPlayersTurn = when {
                    // If player just played and there's only 1 card on table, wait for bot
                    player == playerName && updatedTableCards.size == 1 -> false
                    // If bot just played and there's only 1 card on table, it's player's turn to respond
                    player != playerName && updatedTableCards.size == 1 -> true
                    // If both played (2 cards on table), wait for round resolution
                    updatedTableCards.size == 2 -> false
                    // Default to current state
                    else -> currentState.isPlayerTurn
                }

                Log.d(TAG, "Updated table cards: ${updatedTableCards.keys}, isPlayersTurn: $isPlayersTurn")

                val newPlay = Play(player, card)
                val updatedRecentPlays = (currentState.recentPlays + newPlay).takeLast(4) // Keep last 4 plays

                _gameState.value = currentState.copy(
                    playerCards = updatedPlayerCards,
                    tableCards = updatedTableCards,
                    lastPlay = newPlay,
                    recentPlays = updatedRecentPlays,
                    isPlayerTurn = isPlayersTurn
                )

                addLogEntry("$player jogou: ${card.getDisplayName()}", LogType.GAME_ACTION)
            }
        }

        socket.on(GameConfig.SocketEvents.ROUND_RESULT) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val winner = data.getString("winner")
                val points = data.getInt("points")
                val scores = data.getJSONObject("scores")

                val updatedScores = mutableMapOf<String, Int>()
                val iterator = scores.keys()
                while (iterator.hasNext()) {
                    val key = iterator.next() as String
                    updatedScores[key] = scores.getInt(key)
                }

                // Handle dealt cards if present
                var updatedPlayerCards = _gameState.value.playerCards
                if (data.has("dealtCards")) {
                    try {
                        val dealtCards = data.getJSONObject("dealtCards")
                        val playerName = getCurrentPlayerName()
                        if (dealtCards.has(playerName)) {
                            val newCardFace = dealtCards.getString(playerName)
                            val newCard = Card.fromFace(newCardFace)
                            updatedPlayerCards = updatedPlayerCards + newCard
                            addLogEntry("Você recebeu: ${newCard.getDisplayName()}", LogType.INFO)
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to parse dealt cards", e)
                    }
                }

                _gameState.value = _gameState.value.copy(
                    scores = updatedScores,
                    playerCards = updatedPlayerCards,
                    tableCards = emptyMap() // Clear table after round
                )

                addLogEntry("🏆 Vencedor da rodada: $winner (+$points pontos)", LogType.SUCCESS)
            }
        }

        socket.on(GameConfig.SocketEvents.GAME_ENDED) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val winner = data.getString("winner")
                val finalScores = data.getJSONObject("finalScores")

                _gameState.value = _gameState.value.copy(
                    isGameEnded = true,
                    winner = winner
                )

                addLogEntry("🎉 Jogo terminou! Vencedor: $winner", LogType.SUCCESS)
                addLogEntry("Pontuação final: $finalScores", LogType.INFO)
            }
        }

        socket.on(GameConfig.SocketEvents.GAME_ERROR) { args ->
            if (args.isNotEmpty()) {
                val error = args[0] as JSONObject
                val message = error.getString("message")
                val recovered = if (error.has("recovered")) error.getBoolean("recovered") else false

                Log.e(TAG, "Game error received: $message (recovered: $recovered)")
                addLogEntry("❌ Erro: $message", LogType.ERROR)

                // If error is not recoverable, show it in UI
                if (!recovered) {
                    // Could add UI error state here if needed
                    Log.e(TAG, "Unrecoverable game error: $message")
                }
            }
        }

        // Timer events
        socket.on(GameConfig.SocketEvents.TURN_TIMER_STARTED) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val player = data.getString("player")
                val timeLimit = data.getInt("timeLimit")

                if (player == getCurrentPlayerName()) {
                    _gameState.value = _gameState.value.copy(
                        isPlayerTurn = true,
                        timeRemaining = timeLimit,
                        isTimerActive = true
                    )
                    addLogEntry("⏱️ Sua vez! Você tem 2 minutos para jogar.", LogType.WARNING)
                }
            }
        }

        socket.on(GameConfig.SocketEvents.TURN_TIMER_UPDATE) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val player = data.getString("player")
                val timeRemaining = data.getInt("timeRemaining")

                if (player == getCurrentPlayerName()) {
                    _gameState.value = _gameState.value.copy(
                        timeRemaining = timeRemaining
                    )
                }
            }
        }

        socket.on(GameConfig.SocketEvents.PLAYER_TIMEOUT) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val player = data.getString("player")
                val autoPlayedCard = data.getString("autoPlayedCard")

                if (player == getCurrentPlayerName()) {
                    _gameState.value = _gameState.value.copy(
                        isTimerActive = false,
                        isPlayerTurn = false
                    )
                    addLogEntry("⏰ TEMPO ESGOTADO! Jogada automática: $autoPlayedCard", LogType.ERROR)
                }
            }
        }

        // Bot events
        socket.on(GameConfig.SocketEvents.BOT_TURN_STARTED) {
            _gameState.value = _gameState.value.copy(
                isBotThinking = true
            )
            addLogEntry("Bot está pensando...", LogType.INFO)
        }

        socket.on(GameConfig.SocketEvents.BOT_CARD_PLAYED) { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val cardFace = data.getString("card")
                val card = Card.fromFace(cardFace)

                _gameState.value = _gameState.value.copy(
                    botCard = card,
                    isBotThinking = false
                )

                addLogEntry("🤖 Bot jogou: ${card.getDisplayName()}", LogType.GAME_ACTION)
            }
        }

        socket.on(GameConfig.SocketEvents.ROUND_ENDED) {
            // Clear bot card after round ends
            _gameState.value = _gameState.value.copy(
                botCard = null,
                isPlayerTurn = false,
                isTimerActive = false
            )
        }
    }

    /**
     * Start a single-player game against the bot
     */
    fun startSingleplayerGame() {
        val gameData = JSONObject().apply {
            put("playerName", currentPlayerName)
            put("turnTime", 30)
        }

        Logger.d("Enviando startSingleplayerGame - playerName: $currentPlayerName, dados: $gameData")
        socket?.emit(GameConfig.SocketEvents.START_SINGLEPLAYER_GAME, gameData)
        addLogEntry("Iniciando jogo contra o bot...", LogType.INFO)
        Logger.gameEvent("Iniciando jogo single-player")
    }

    /**
     * Play a card
     */
    fun playCard(card: Card) {
        Log.d(TAG, "playCard() called with card: ${card.getDisplayName()}")
        Log.d(TAG, "Socket connected: ${socket?.connected()}")
        Log.d(TAG, "Connection status: ${_connectionStatus.value}")

        val currentState = _gameState.value

        // Validate required data before sending
        if (currentState.gameId.isEmpty()) {
            Log.e(TAG, "Cannot play card: gameId is empty")
            addLogEntry("❌ Erro: Jogo não encontrado", LogType.ERROR)
            return
        }

        val playerName = getCurrentPlayerName()
        if (playerName.isEmpty()) {
            Log.e(TAG, "Cannot play card: playerName is empty")
            addLogEntry("❌ Erro: Nome do jogador não definido", LogType.ERROR)
            return
        }

        val cardData = JSONObject().apply {
            put("gameId", currentState.gameId)
            put("playerName", playerName)
            put("cardFace", card.face)
        }

        Log.d(TAG, "Sending card data: $cardData")
        Log.d(TAG, "Using event: ${GameConfig.SocketEvents.PLAY_CARD}")

        socket?.emit(GameConfig.SocketEvents.PLAY_CARD, cardData)
        addLogEntry("Você jogou: ${card.getDisplayName()}", LogType.GAME_ACTION)
        Logger.cardEvent("Jogador jogou carta: ${card.face}")

        Log.d(TAG, "Card play request sent to server")
    }

    /**
     * Disconnect from server
     */
    fun disconnect() {
        socket?.disconnect()
        socket = null
        _connectionStatus.value = ConnectionStatus.DISCONNECTED
        _gameState.value = GameState()
    }

    private fun parseGameState(state: JSONObject): GameState {
        return try {
            Log.d(TAG, "Parsing game state JSON: $state")

            // Debug: Log all keys in the state object
            val stateKeys = state.keys().asSequence().toList()
            Log.d(TAG, "State object keys: $stateKeys")

            // Parse trump using enhanced debug utility
            val rawTrump = if (state.has("trump")) state.getString("trump") else ""
            val (trump, trumpCard) = TrumpCardDebug.parseTrumpFromServer(rawTrump)

            val currentPlayer = when {
                state.has("currentPlayer") -> state.getString("currentPlayer")
                state.has("currentTurn") -> state.getString("currentTurn")
                else -> ""
            }
            val deckSize = if (state.has("deckSize")) {
                state.getInt("deckSize")
            } else if (state.has("remaining")) {
                state.getInt("remaining")
            } else 0
            Log.d(TAG, "Parsed basic state - trump: $trump, currentPlayer: $currentPlayer, deckSize: $deckSize")

            // Parse player cards - handle both 'playerCards' and 'hands' structure
            val playerCards = mutableListOf<Card>()
            Log.d(TAG, "Parsing game state - has playerCards: ${state.has("playerCards")}, has hands: ${state.has("hands")}")

            when {
                // New structure: playerCards array
                state.has("playerCards") -> {
                    val playerCardsJson = state.getJSONArray("playerCards")
                    Log.d(TAG, "PlayerCards JSON array length: ${playerCardsJson.length()}")
                    Log.d(TAG, "PlayerCards JSON content: $playerCardsJson")
                    for (i in 0 until playerCardsJson.length()) {
                        try {
                            val cardFace = playerCardsJson.getString(i)
                            Log.d(TAG, "Parsing card face: $cardFace")
                            val card = Card.fromFace(cardFace)
                            playerCards.add(card)
                            Log.d(TAG, "Successfully parsed card: ${card.getDisplayName()}")
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse card: ${playerCardsJson.getString(i)}", e)
                        }
                    }
                }
                // Old structure: hands object
                state.has("hands") -> {
                    val handsJson = state.getJSONObject("hands")
                    Log.d(TAG, "Hands JSON object: $handsJson")

                    // Find player's hand (not bot's hand)
                    val handsIterator = handsJson.keys()
                    while (handsIterator.hasNext()) {
                        val playerName = handsIterator.next() as String
                        Log.d(TAG, "Checking hand for player: $playerName, current player: ${getCurrentPlayerName()}")
                        if (playerName != "Bot") {
                            val playerHandJson = handsJson.getJSONArray(playerName)
                            Log.d(TAG, "Found player hand for $playerName: $playerHandJson")

                            for (i in 0 until playerHandJson.length()) {
                                try {
                                    val cardFace = playerHandJson.getString(i)
                                    Log.d(TAG, "Parsing card face from hands: $cardFace")
                                    val card = Card.fromFace(cardFace)
                                    playerCards.add(card)
                                    Log.d(TAG, "Successfully parsed card from hands: ${card.getDisplayName()}")
                                } catch (e: Exception) {
                                    Log.e(TAG, "Failed to parse card from hands: ${playerHandJson.getString(i)}", e)
                                }
                            }
                            break
                        }
                    }
                }
                else -> {
                    Log.w(TAG, "No playerCards or hands found in game state JSON")
                }
            }
            Log.d(TAG, "Final playerCards list size: ${playerCards.size}")
            playerCards.forEachIndexed { index, card ->
                Log.d(TAG, "Card $index: ${card.getDisplayName()} (${card.face})")
            }

            // Parse table cards
            val tableCards = mutableMapOf<String, Card>()
            if (state.has("tableCards")) {
                val tableCardsJson = state.getJSONObject("tableCards")
                Log.d(TAG, "TableCards JSON: $tableCardsJson")
                val tableIterator = tableCardsJson.keys()
                while (tableIterator.hasNext()) {
                    val playerName = tableIterator.next() as String
                    try {
                        val cardFace = tableCardsJson.getString(playerName)
                        val card = Card.fromFace(cardFace)
                        tableCards[playerName] = card
                        Log.d(TAG, "Parsed table card for $playerName: ${card.getDisplayName()}")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to parse table card for $playerName", e)
                    }
                }
            }

            // Parse scores
            val scores = mutableMapOf<String, Int>()
            if (state.has("scores")) {
                val scoresJson = state.getJSONObject("scores")
                val iterator = scoresJson.keys()
                while (iterator.hasNext()) {
                    val key = iterator.next() as String
                    scores[key] = scoresJson.getInt(key)
                }
            }

            // Determine if it's player's turn based on current player and table state
            val playerName = getCurrentPlayerName()
            val isPlayersTurn = when {
                // Direct match with current player
                currentPlayer == playerName -> true
                // If there are table cards, check if player needs to respond
                tableCards.isNotEmpty() -> {
                    val tableCardCount = tableCards.size
                    // If there's 1 card on table and it's not from player, player needs to respond
                    tableCardCount == 1 && !tableCards.containsKey(playerName)
                }
                // Default case
                else -> false
            }

            Log.d(TAG, "Player turn determination: currentPlayer=$currentPlayer, playerName=$playerName, tableCardCount=${tableCards.size}, isPlayersTurn=$isPlayersTurn")

            val newGameState = GameState(
                trump = trump,
                currentPlayer = currentPlayer,
                playerCards = playerCards,
                tableCards = tableCards,
                scores = scores,
                deckSize = deckSize,
                isPlayerTurn = isPlayersTurn
            ).copy(
                // Add trump card if available
                trumpCard = trumpCard
            )

            Log.d(TAG, "GameState created - Trump: '${newGameState.trump}', TrumpCard: ${newGameState.trumpCard?.getDisplayName() ?: "null"}")
            Log.d(TAG, "Created GameState with ${newGameState.playerCards.size} player cards")
            newGameState
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse game state", e)
            GameState() // Return empty state on error
        }
    }

    private fun addLogEntry(message: String, type: LogType) {
        val currentLog = _gameLog.value.toMutableList()
        currentLog.add(GameLogEntry(message, System.currentTimeMillis(), type))
        // Keep only last entries based on config
        if (currentLog.size > GameConfig.LOG_MAX_ENTRIES) {
            currentLog.removeAt(0)
        }
        _gameLog.value = currentLog

        // Log to system based on type
        when (type) {
            LogType.ERROR -> Logger.e(message)
            LogType.WARNING -> Logger.w(message)
            LogType.SUCCESS -> Logger.i(message)
            LogType.GAME_ACTION -> Logger.gameEvent(message)
            LogType.INFO -> Logger.d(message)
        }
    }

    private fun getCurrentPlayerName(): String {
        return currentPlayerName
    }
}
