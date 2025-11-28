package com.example.android.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.android.data.*
import com.example.android.repository.GameRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

/**
 * ViewModel for managing game state and business logic
 */
class GameViewModel : ViewModel() {
    private val repository = GameRepository()

    // Expose repository states
    val connectionStatus = repository.connectionStatus
    val gameState = repository.gameState
    val gameLog = repository.gameLog

    // UI State
    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    // Player state
    private val _playerName = MutableStateFlow("")
    val playerName: StateFlow<String> = _playerName.asStateFlow()

    // Selected card for playing
    private val _selectedCard = MutableStateFlow<Card?>(null)
    val selectedCard: StateFlow<Card?> = _selectedCard.asStateFlow()

    // Timer countdown
    private val _timerSeconds = MutableStateFlow(0)
    val timerSeconds: StateFlow<Int> = _timerSeconds.asStateFlow()

    init {
        observeGameState()
        observeTimer()
    }

    /**
     * Connect to server and authenticate player
     */
    fun connectToServer(playerName: String) {
        if (playerName.isBlank()) {
            _uiState.value = _uiState.value.copy(
                error = "Digite seu nome!"
            )
            return
        }

        _playerName.value = playerName
        _uiState.value = _uiState.value.copy(
            isLoading = true,
            error = null
        )

        viewModelScope.launch {
            repository.connect(playerName).collect { success ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isConnected = success
                )
                if (!success) {
                    _uiState.value = _uiState.value.copy(
                        error = "Falha na conexão"
                    )
                }
            }
        }
    }

    /**
     * Start single-player game against bot
     */
    fun startSingleplayerGame() {
        repository.startSingleplayerGame()
        _uiState.value = _uiState.value.copy(
            gameStarted = true
        )
    }

    /**
     * Select a card to play
     */
    fun selectCard(card: Card) {
        val currentState = gameState.value
        if (!currentState.isPlayerTurn || currentState.isGameEnded) {
            android.util.Log.w("GameViewModel", "Can't select card - not player's turn or game ended")
            return // Can't select cards when it's not player's turn or game has ended
        }

        android.util.Log.d("GameViewModel", "Selecting card: ${card.getDisplayName()}")
        _selectedCard.value = if (_selectedCard.value == card) null else card
    }

    /**
     * Play the selected card
     */
    fun playSelectedCard() {
        android.util.Log.d("GameViewModel", "playSelectedCard() called")

        val card = _selectedCard.value
        val currentState = gameState.value

        android.util.Log.d("GameViewModel", "Selected card: ${card?.getDisplayName()}")
        android.util.Log.d("GameViewModel", "Is player turn: ${currentState.isPlayerTurn}")
        android.util.Log.d("GameViewModel", "Player cards count: ${currentState.playerCards.size}")
        android.util.Log.d("GameViewModel", "Game ended: ${currentState.isGameEnded}")

        if (card == null) {
            android.util.Log.w("GameViewModel", "No card selected")
            _uiState.value = _uiState.value.copy(
                error = "Selecione uma carta para jogar"
            )
            return
        }

        if (!currentState.isPlayerTurn) {
            android.util.Log.w("GameViewModel", "Not player's turn")
            _uiState.value = _uiState.value.copy(
                error = "Não é a sua vez"
            )
            return
        }

        if (!currentState.playerCards.contains(card)) {
            android.util.Log.w("GameViewModel", "Card not in player's hand")
            android.util.Log.d("GameViewModel", "Player cards: ${currentState.playerCards.map { it.getDisplayName() }}")
            _uiState.value = _uiState.value.copy(
                error = "Carta inválida"
            )
            return
        }

        android.util.Log.d("GameViewModel", "Playing card: ${card.getDisplayName()}")
        repository.playCard(card)
        _selectedCard.value = null
        clearError()
        android.util.Log.d("GameViewModel", "Card played successfully")
    }

    /**
     * Play a card directly (alternative to select + play)
     */
    fun playCard(card: Card) {
        selectCard(card)
        playSelectedCard()
    }

    /**
     * Disconnect from server
     */
    fun disconnect() {
        repository.disconnect()
        _uiState.value = GameUiState()
        _selectedCard.value = null
        _playerName.value = ""
    }

    /**
     * Clear current error message
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    /**
     * Get player's score
     */
    fun getPlayerScore(): Int {
        return gameState.value.scores[_playerName.value] ?: 0
    }

    /**
     * Get bot's score
     */
    fun getBotScore(): Int {
        val scores = gameState.value.scores
        return scores.values.firstOrNull { it != getPlayerScore() } ?: 0
    }

    /**
     * Get bot's name
     */
    fun getBotName(): String {
        val scores = gameState.value.scores
        return scores.keys.firstOrNull { it != _playerName.value } ?: "Bot"
    }

    /**
     * Check if card can be played
     */
    fun canPlayCard(card: Card): Boolean {
        val currentState = gameState.value
        return currentState.isPlayerTurn &&
               currentState.playerCards.contains(card) &&
               !currentState.isGameEnded
    }

    /**
     * Get trump card display info
     */
    fun getTrumpInfo(): String {
        val trump = gameState.value.trump
        return when (trump) {
            Card.COPAS -> "♥ Copas"
            Card.ESPADAS -> "♠ Espadas"
            Card.OUROS -> "♦ Ouros"
            Card.PAUS -> "♣ Paus"
            else -> trump
        }
    }

    /**
     * Get timer display text
     */
    fun getTimerDisplay(): String {
        val seconds = _timerSeconds.value
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format("%d:%02d", minutes, remainingSeconds)
    }

    /**
     * Check if timer is in warning state (< 30 seconds)
     */
    fun isTimerWarning(): Boolean = _timerSeconds.value in 1..30

    /**
     * Check if timer is in danger state (< 10 seconds)
     */
    fun isTimerDanger(): Boolean = _timerSeconds.value in 1..10

    private fun observeGameState() {
        viewModelScope.launch {
            gameState.collect { state ->
                _uiState.value = _uiState.value.copy(
                    gameStarted = state.isGameStarted,
                    gameEnded = state.isGameEnded,
                    isPlayerTurn = state.isPlayerTurn,
                    winner = state.winner
                )
            }
        }
    }

    private fun observeTimer() {
        viewModelScope.launch {
            gameState.collect { state ->
                if (state.isTimerActive && state.isPlayerTurn) {
                    _timerSeconds.value = state.timeRemaining
                    startCountdown()
                } else {
                    _timerSeconds.value = 0
                }
            }
        }
    }

    private fun startCountdown() {
        viewModelScope.launch {
            while (_timerSeconds.value > 0 && gameState.value.isTimerActive) {
                delay(1000)
                if (gameState.value.isTimerActive) {
                    _timerSeconds.value = (_timerSeconds.value - 1).coerceAtLeast(0)
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        repository.disconnect()
    }
}

/**
 * UI State for the game screen
 */
data class GameUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val gameStarted: Boolean = false,
    val gameEnded: Boolean = false,
    val isPlayerTurn: Boolean = false,
    val winner: String? = null,
    val error: String? = null
)
