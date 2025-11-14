package com.example.android.utils

/**
 * Global configuration constants for the Bisca game
 */
object GameConfig {

    // Server Configuration
    const val SERVER_URL_EMULATOR = "http://10.0.2.2:3000"
    const val SERVER_URL_LOCALHOST = "http://localhost:3000"
    const val SERVER_URL_PHYSICAL_DEVICE = "http://192.168.1.24:3000"

    // URLs alternativos para testar
    private val SERVER_URLS = listOf(
        SERVER_URL_PHYSICAL_DEVICE,
        SERVER_URL_EMULATOR,
        SERVER_URL_LOCALHOST
    )

    const val SERVER_URL_DEFAULT = SERVER_URL_PHYSICAL_DEVICE

    /**
     * Obtém a lista de URLs do servidor para tentar conectar
     */
    fun getServerUrls(): List<String> = SERVER_URLS

    /**
     * Obtém URL baseado no tipo de dispositivo/emulador
     */
    fun getServerUrlForDevice(): String {
        return try {
            // Tenta detectar se é emulador verificando propriedades do sistema
            val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
                    || android.os.Build.FINGERPRINT.startsWith("unknown")
                    || android.os.Build.MODEL.contains("google_sdk")
                    || android.os.Build.MODEL.contains("Emulator")
                    || android.os.Build.MODEL.contains("Android SDK built for x86")
                    || android.os.Build.MANUFACTURER.contains("Genymotion")
                    || (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic"))
                    || "google_sdk" == android.os.Build.PRODUCT

            if (isEmulator) SERVER_URL_EMULATOR else SERVER_URL_PHYSICAL_DEVICE
        } catch (e: Exception) {
            SERVER_URL_DEFAULT // Fallback
        }
    }

    // Game Configuration
    const val TURN_TIMEOUT_SECONDS = 120 // 2 minutes
    const val TIMER_WARNING_THRESHOLD = 30 // seconds
    const val TIMER_DANGER_THRESHOLD = 10 // seconds

    // UI Configuration
    const val CARD_ANIMATION_DURATION = 200 // milliseconds
    const val LOG_MAX_ENTRIES = 100
    const val AUTO_SCROLL_DELAY = 300 // milliseconds

    // Card Configuration
    const val TOTAL_CARDS_IN_DECK = 40
    const val CARDS_PER_PLAYER = 3

    // Connection Configuration
    const val CONNECTION_TIMEOUT = 5000 // milliseconds
    const val RECONNECT_ATTEMPTS = 3
    const val RECONNECT_DELAY = 2000 // milliseconds

    // Debug Configuration
    const val DEBUG_MODE = true
    const val VERBOSE_LOGGING = false

    // Game Rules
    object CardValues {
        const val ACE_POINTS = 11
        const val SEVEN_POINTS = 10
        const val KING_POINTS = 4
        const val JACK_POINTS = 3
        const val QUEEN_POINTS = 2
        const val OTHER_POINTS = 0
    }

    object CardRanks {
        const val TWO_RANK = 1
        const val THREE_RANK = 2
        const val FOUR_RANK = 3
        const val FIVE_RANK = 4
        const val SIX_RANK = 5
        const val QUEEN_RANK = 6
        const val JACK_RANK = 7
        const val KING_RANK = 8
        const val SEVEN_RANK = 9
        const val ACE_RANK = 10
    }

    // Socket.IO Events
    object SocketEvents {
        // Client to Server
        const val AUTH = "auth"
        const val START_SINGLEPLAYER_GAME = "startSingleplayerGame"
        const val PLAY_CARD = "playCard"

        // Server to Client
        const val AUTH_SUCCESS = "authSuccess"
        const val AUTH_ERROR = "authError"
        const val GAME_STARTED = "gameStarted"
        const val CARD_PLAYED = "cardPlayed"
        const val ROUND_RESULT = "roundResult"
        const val GAME_ENDED = "gameEnded"
        const val GAME_STATE_UPDATE = "gameStateUpdate"
        const val GAME_ERROR = "gameError"
        const val TURN_TIMER_STARTED = "turnTimerStarted"
        const val TURN_TIMER_UPDATE = "turnTimerUpdate"
        const val PLAYER_TIMEOUT = "playerTimeout"
        const val BOT_TURN_STARTED = "botTurnStarted"
        const val BOT_CARD_PLAYED = "botCardPlayed"
        const val ROUND_ENDED = "roundEnded"

        // Connection Events
        const val CONNECT = "connect"
        const val DISCONNECT = "disconnect"
        const val CONNECT_ERROR = "connect_error"
    }

    // Error Messages
    object ErrorMessages {
        const val INVALID_PLAYER_NAME = "Digite seu nome!"
        const val CONNECTION_FAILED = "Falha na conexão"
        const val SELECT_CARD_FIRST = "Selecione uma carta para jogar"
        const val NOT_YOUR_TURN = "Não é a sua vez"
        const val INVALID_CARD = "Carta inválida"
        const val SERVER_ERROR = "Erro do servidor"
        const val TIMEOUT_ERROR = "Tempo esgotado"
        const val NETWORK_ERROR = "Erro de rede"
    }

    // Success Messages
    object SuccessMessages {
        const val CONNECTED = "Conectado com sucesso"
        const val AUTHENTICATED = "Autenticado com sucesso"
        const val GAME_STARTED = "Jogo iniciado"
        const val CARD_PLAYED = "Carta jogada"
        const val ROUND_WON = "Rodada vencida"
        const val GAME_WON = "Jogo vencido"
    }

    // UI Strings
    object UIStrings {
        const val APP_NAME = "Bisca"
        const val CONNECTING = "Conectando..."
        const val PLAYER_TURN = "Sua vez!"
        const val BOT_TURN = "Vez do Bot"
        const val WAITING = "Aguardando..."
        const val GAME_OVER = "Jogo Terminado"
        const val NEW_GAME = "Novo Jogo"
        const val EXIT_GAME = "Sair"
        const val TRUMP_CARD = "Trunfo"
        const val DECK = "Baralho"
        const val SCORES = "Pontuação"
        const val GAME_LOG = "Log do Jogo"
    }
}
