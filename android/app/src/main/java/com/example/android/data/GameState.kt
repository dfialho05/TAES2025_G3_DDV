package com.example.android.data

/**
 * Represents the current state of a Bisca game
 */
data class GameState(
    val gameId: String = "",
    val players: List<Player> = emptyList(),
    val currentPlayer: String = "",
    val trump: String = "",
    val trumpCard: Card? = null,
    val playerCards: List<Card> = emptyList(),
    val tableCards: Map<String, Card> = emptyMap(),
    val scores: Map<String, Int> = emptyMap(),
    val deckSize: Int = 0,
    val isGameStarted: Boolean = false,
    val isGameEnded: Boolean = false,
    val winner: String? = null,
    val currentRound: Int = 0,
    val lastPlay: Play? = null,
    val recentPlays: List<Play> = emptyList(),
    val isPlayerTurn: Boolean = false,
    val timeRemaining: Int = 0,
    val isTimerActive: Boolean = false,
    val botCard: Card? = null,
    val isBotThinking: Boolean = false
)

/**
 * Represents a player in the game
 */
data class Player(
    val name: String,
    val isBot: Boolean = false,
    val score: Int = 0,
    val cardCount: Int = 0
)

/**
 * Represents a play made in the game
 */
data class Play(
    val player: String,
    val card: Card,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Represents a round result
 */
data class RoundResult(
    val winner: String,
    val points: Int,
    val playerCards: Map<String, Card>,
    val scores: Map<String, Int>,
    val dealtCards: Map<String, Card>? = null
)

/**
 * Represents connection status
 */
enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    AUTHENTICATED,
    IN_GAME,
    ERROR
}

/**
 * Represents different game phases
 */
enum class GamePhase {
    WAITING,
    STARTING,
    PLAYING,
    ROUND_END,
    GAME_END
}

/**
 * Represents log entries for game events
 */
data class GameLogEntry(
    val message: String,
    val timestamp: Long = System.currentTimeMillis(),
    val type: LogType = LogType.INFO
)

enum class LogType {
    INFO,
    SUCCESS,
    WARNING,
    ERROR,
    GAME_ACTION
}
