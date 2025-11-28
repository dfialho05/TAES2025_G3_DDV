package com.example.android.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.android.data.Card
import com.example.android.data.ConnectionStatus
import com.example.android.ui.components.*
import com.example.android.ui.theme.*
import com.example.android.viewmodel.GameViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GameScreen(
    onExit: () -> Unit,
    isDark: Boolean,
    onToggleTheme: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: GameViewModel = viewModel()
) {
    val connectionStatus by viewModel.connectionStatus.collectAsState()
    val gameState by viewModel.gameState.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val gameLog by viewModel.gameLog.collectAsState()
    val selectedCard by viewModel.selectedCard.collectAsState()
    val playerName by viewModel.playerName.collectAsState()
    val timerSeconds by viewModel.timerSeconds.collectAsState()

    var showPlayerNameDialog by remember { mutableStateOf(false) }
    var inputPlayerName by remember { mutableStateOf("") }
    var showGameLog by remember { mutableStateOf(false) }

    // Show player name dialog if not connected
    LaunchedEffect(connectionStatus) {
        if (connectionStatus == ConnectionStatus.DISCONNECTED && playerName.isEmpty()) {
            showPlayerNameDialog = true
        }
    }

    // Background gradient
    val backgroundGradient = Brush.verticalGradient(
        colors = listOf(
            MaterialTheme.colorScheme.background,
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        )
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundGradient)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Modern Top Bar
            ModernTopBar(
                isDark = isDark,
                onToggleTheme = onToggleTheme,
                connectionStatus = connectionStatus,
                onExit = {
                    viewModel.disconnect()
                    onExit()
                },
                onShowLog = { showGameLog = true }
            )

            when (connectionStatus) {
                ConnectionStatus.DISCONNECTED, ConnectionStatus.CONNECTING -> {
                    LoginSection(
                        connectionStatus = connectionStatus,
                        onConnect = { name ->
                            viewModel.connectToServer(name)
                        }
                    )
                }

                ConnectionStatus.AUTHENTICATED -> {
                    GameLobbySection(
                        onStartGame = { viewModel.startSingleplayerGame() },
                        isLoading = uiState.isLoading
                    )
                }

                else -> {
                    // Main game content
                    GameContent(
                        gameState = gameState,
                        selectedCard = selectedCard,
                        playerName = playerName,
                        timerSeconds = timerSeconds,
                        onCardClick = { card -> viewModel.selectCard(card) },
                        onPlayCard = { viewModel.playSelectedCard() },
                        onNewGame = { viewModel.startSingleplayerGame() },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Error message overlay
        uiState.error?.let { error ->
            ErrorOverlay(
                error = error,
                onDismiss = { viewModel.clearError() }
            )
        }

        // Game log bottom sheet
        if (showGameLog) {
            GameLogBottomSheet(
                gameLog = gameLog,
                onDismiss = { showGameLog = false }
            )
        }
    }

    // Player name dialog
    if (showPlayerNameDialog) {
        PlayerNameDialog(
            playerName = inputPlayerName,
            onPlayerNameChange = { inputPlayerName = it },
            onConfirm = {
                if (inputPlayerName.isNotBlank()) {
                    viewModel.connectToServer(inputPlayerName.trim())
                    showPlayerNameDialog = false
                }
            },
            onDismiss = {
                showPlayerNameDialog = false
                onExit()
            }
        )
    }
}

@Composable
private fun ModernTopBar(
    isDark: Boolean,
    onToggleTheme: () -> Unit,
    connectionStatus: ConnectionStatus,
    onExit: () -> Unit,
    onShowLog: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Game title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "🎴",
                    fontSize = 28.sp
                )
                Text(
                    text = "Bisca",
                    style = GameTextStyles.GameTitle.copy(
                        fontSize = 24.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Connection status
                ModernConnectionStatus(status = connectionStatus)

                // Theme toggle
                IconButton(
                    onClick = onToggleTheme,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Text(
                        text = if (isDark) "☀️" else "🌙",
                        fontSize = 20.sp
                    )
                }

                // Log button
                IconButton(
                    onClick = onShowLog,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondaryContainer)
                ) {
                    Text(
                        text = "📋",
                        fontSize = 16.sp
                    )
                }

                // Exit button
                IconButton(
                    onClick = onExit,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.errorContainer)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Exit",
                        tint = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
    }
}

@Composable
private fun ModernConnectionStatus(
    status: ConnectionStatus,
    modifier: Modifier = Modifier
) {
    val (text, color, icon) = when (status) {
        ConnectionStatus.DISCONNECTED -> Triple("Offline", StatusError, "❌")
        ConnectionStatus.CONNECTING -> Triple("Conectando", StatusWarning, "🔄")
        ConnectionStatus.CONNECTED -> Triple("Online", StatusSuccess, "✅")
        ConnectionStatus.AUTHENTICATED -> Triple("Pronto", StatusSuccess, "✅")
        ConnectionStatus.IN_GAME -> Triple("Jogando", StatusInfo, "🎮")
        ConnectionStatus.ERROR -> Triple("Erro", StatusError, "❌")
    }

    Surface(
        modifier = modifier,
        shape = GameShapes.StatusIndicator,
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = icon, fontSize = 12.sp)
            Text(
                text = text,
                style = GameTextStyles.StatusText.copy(
                    color = color,
                    fontSize = 12.sp
                )
            )
        }
    }
}

@Composable
private fun LoginSection(
    connectionStatus: ConnectionStatus,
    onConnect: (String) -> Unit
) {
    var playerName by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Welcome section
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = GameShapes.LobbyPanel,
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🎴",
                    fontSize = 64.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Bem-vindo ao Bisca!",
                    style = GameTextStyles.GameTitle.copy(
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Jogue contra a IA e teste suas habilidades",
                    style = GameTextStyles.GameSubtitle.copy(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    ),
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Login form
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = GameShapes.GameSection,
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                OutlinedTextField(
                    value = playerName,
                    onValueChange = { playerName = it },
                    label = { Text("Seu nome") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = GameShapes.ActionButton,
                    enabled = connectionStatus != ConnectionStatus.CONNECTING
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = { onConnect(playerName) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = GameShapes.PrimaryButton,
                    enabled = playerName.isNotBlank() && connectionStatus != ConnectionStatus.CONNECTING
                ) {
                    if (connectionStatus == ConnectionStatus.CONNECTING) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Conectando...")
                    } else {
                        Text(
                            "Entrar no Jogo",
                            style = GameTextStyles.GameButton
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GameLobbySection(
    onStartGame: () -> Unit,
    isLoading: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = GameShapes.LobbyPanel,
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🎯",
                    fontSize = 48.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Pronto para Jogar!",
                    style = GameTextStyles.GameTitle.copy(
                        fontSize = 28.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Clique no botão abaixo para começar uma partida contra o bot",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = onStartGame,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp),
                    shape = GameShapes.PrimaryButton,
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Iniciando...")
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text("🤖", fontSize = 24.sp)
                            Text(
                                "Jogar vs Bot",
                                style = GameTextStyles.GameButton.copy(
                                    fontSize = 18.sp
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GameContent(
    gameState: com.example.android.data.GameState,
    selectedCard: Card?,
    playerName: String,
    timerSeconds: Int,
    onCardClick: (Card) -> Unit,
    onPlayCard: () -> Unit,
    onNewGame: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Game status and timer
        GameStatusSection(
            gameState = gameState,
            timerSeconds = timerSeconds,
            playerName = playerName
        )

        // Bot area with table cards and trump
        BotAndTableSection(
            botCard = gameState.botCard,
            isThinking = gameState.isBotThinking,
            tableCards = gameState.tableCards,
            trump = gameState.trump,
            trumpCard = gameState.trumpCard,
            playerName = playerName
        )

        // Game info (trump, deck)
        GameInfoSection(
            trump = gameState.trump,
            deckSize = gameState.deckSize,
            scores = gameState.scores,
            playerName = playerName
        )

        // Player cards
        PlayerCardsSection(
            cards = gameState.playerCards,
            selectedCard = selectedCard,
            onCardClick = onCardClick,
            onPlayCard = onPlayCard,
            canPlay = gameState.isPlayerTurn && !gameState.isGameEnded,
            isResponding = gameState.tableCards.isNotEmpty()
        )

        // Last played cards section (before game end)
        LastPlayedCardsSection(gameState = gameState)

        // Game end section
        if (gameState.isGameEnded) {
            GameEndSection(
                winner = gameState.winner,
                finalScores = gameState.scores,
                playerName = playerName,
                onNewGame = onNewGame
            )
        }
    }
}

@Composable
private fun GameStatusSection(
    gameState: com.example.android.data.GameState,
    timerSeconds: Int,
    playerName: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = GameShapes.GameSection,
        color = if (gameState.isPlayerTurn) {
            PlayerTurn.copy(alpha = 0.1f)
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        }
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                val statusText = when {
                    gameState.isPlayerTurn && gameState.tableCards.isEmpty() -> "Sua vez! Jogue primeiro"
                    gameState.isPlayerTurn && gameState.tableCards.isNotEmpty() -> "Sua vez! Responda à jogada"
                    gameState.isBotThinking -> "Bot pensando..."
                    else -> "Aguarde..."
                }

                Text(
                    text = statusText,
                    style = GameTextStyles.GameSubtitle.copy(
                        color = if (gameState.isPlayerTurn) BiscaGreen else MaterialTheme.colorScheme.onSurface
                    )
                )

                if (gameState.tableCards.isNotEmpty() && gameState.isPlayerTurn) {
                    Text(
                        text = "↪️ Responda com uma carta",
                        style = GameTextStyles.InfoText.copy(
                            color = BiscaGold,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }

                Text(
                    text = "Jogador: $playerName",
                    style = GameTextStyles.InfoText.copy(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                )
            }

            if (gameState.isPlayerTurn && gameState.isTimerActive) {
                ModernGameTimer(
                    timeRemaining = timerSeconds,
                    isDanger = timerSeconds <= 30
                )
            }
        }
    }
}

@Composable
private fun BotAndTableSection(
    botCard: Card?,
    isThinking: Boolean,
    tableCards: Map<String, Card>,
    trump: String,
    trumpCard: Card?,
    playerName: String
) {
    Column {
        // First row: Bot and Table
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.Top
        ) {
            // Bot area
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "🤖 Bot",
                    style = GameTextStyles.PlayerName
                )

                Spacer(modifier = Modifier.height(12.dp))

                ModernBotCardArea(
                    card = botCard,
                    isThinking = isThinking
                )
            }

            // Table cards area with animation
            AnimatedVisibility(
                visible = tableCards.isNotEmpty(),
                enter = fadeIn() + scaleIn(),
                exit = fadeOut() + scaleOut(),
                modifier = Modifier.weight(1f)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = TableGreen.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "🃏 Mesa",
                            style = GameTextStyles.PlayerName,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        tableCards.entries.forEachIndexed { index, (player, card) ->
                            AnimatedVisibility(
                                visible = true,
                                enter = slideInVertically(
                                    initialOffsetY = { -it },
                                    animationSpec = tween(300, delayMillis = index * 150)
                                ) + fadeIn(animationSpec = tween(300, delayMillis = index * 150))
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = if (player.contains("Bot") || player != playerName)
                                            StatusWarning.copy(alpha = 0.2f) else
                                            BiscaGreen.copy(alpha = 0.2f),
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    ) {
                                        Text(
                                            text = if (player.contains("Bot") || player != playerName) "🤖" else "👤",
                                            fontSize = 12.sp,
                                            modifier = Modifier.padding(4.dp)
                                        )
                                    }

                                    ModernPlayingCard(
                                        card = card,
                                        isSelected = false,
                                        isClickable = false,
                                        size = CardSize.SMALL
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Empty space for better layout
            Spacer(modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Trump card area - separate row for better visibility
        AnimatedVisibility(
            visible = trump.isNotEmpty(),
            enter = slideInHorizontally(
                initialOffsetX = { it },
                animationSpec = tween(400)
            ) + fadeIn(animationSpec = tween(400))
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = BiscaGold.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "👑 Trunfo",
                            style = GameTextStyles.PlayerName,
                            color = BiscaGoldDark,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Use real trump card if available, otherwise create dummy with better fallback
                    val displayTrumpCard = trumpCard ?: try {
                        when (trump.lowercase()) {
                            "c", "copas" -> Card.create(Card.COPAS, 7)  // Use 7 (high value card)
                            "e", "espadas" -> Card.create(Card.ESPADAS, 7)
                            "o", "ouros" -> Card.create(Card.OUROS, 7)
                            "p", "paus" -> Card.create(Card.PAUS, 7)
                            else -> {
                                // If trump is empty or invalid, try to extract from server format
                                if (trump.contains("-")) {
                                    val parts = trump.split("-")
                                    if (parts.size >= 2) {
                                        Card.fromFace(parts[1].trim())
                                    } else {
                                        Card.create(Card.COPAS, 7)
                                    }
                                } else {
                                    Card.create(Card.COPAS, 7)
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // Last resort fallback
                        Card.create(Card.COPAS, 7)
                    }

                    val scale by animateFloatAsState(
                        targetValue = 1.0f,
                        animationSpec = tween(durationMillis = 200),
                        label = "trump_scale"
                    )

                    // Use alternative trump card component for better visibility
                    AlternativeTrumpCard(
                        card = displayTrumpCard,
                        modifier = Modifier.scale(scale)
                    )
                }
            }
        }
    }
}



@Composable
private fun GameInfoSection(
    trump: String,
    deckSize: Int,
    scores: Map<String, Int>,
    playerName: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = GameShapes.GameSection,
        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            // Deck size
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Baralho",
                    style = GameTextStyles.InfoText
                )
                Text(
                    text = "$deckSize",
                    style = GameTextStyles.ScoreNumber.copy(fontSize = 20.sp)
                )
            }

            // Scores
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Placar",
                    style = GameTextStyles.InfoText
                )
                val playerScore = scores[playerName] ?: 0
                val botScore = scores.entries.find { !it.key.contains(playerName) }?.value ?: 0
                Text(
                    text = "$playerScore - $botScore",
                    style = GameTextStyles.ScoreNumber.copy(fontSize = 16.sp)
                )
            }
        }
    }
}

@Composable
private fun PlayerCardsSection(
    cards: List<Card>,
    selectedCard: Card?,
    onCardClick: (Card) -> Unit,
    onPlayCard: () -> Unit,
    canPlay: Boolean,
    isResponding: Boolean = false
) {
    // Debug logging
    LaunchedEffect(cards) {
        android.util.Log.d("PlayerCardsSection", "Cards list updated: ${cards.size} cards")
        cards.forEachIndexed { index, card ->
            android.util.Log.d("PlayerCardsSection", "Card $index: ${card.getDisplayName()} (${card.face})")
        }
    }

    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val headerText = if (isResponding) {
                "👤 Suas Cartas (${cards.size}) - Responda!"
            } else {
                "👤 Suas Cartas (${cards.size})"
            }

            Text(
                text = headerText,
                style = GameTextStyles.PlayerName.copy(
                    color = if (isResponding) BiscaGold else MaterialTheme.colorScheme.onSurface
                )
            )

            // Play card button - always visible when can play and card is selected
            if (selectedCard != null && canPlay) {
                AnimatedVisibility(
                    visible = true,
                    enter = slideInVertically() + fadeIn(),
                    exit = slideOutVertically() + fadeOut()
                ) {
                    Button(
                        onClick = {
                            android.util.Log.d("GameScreen", "Jogar Carta button clicked - Selected card: ${selectedCard.getDisplayName()}")
                            android.util.Log.d("GameScreen", "Can play: $canPlay")
                            onPlayCard()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BiscaGreen,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .padding(4.dp)
                            .fillMaxWidth(0.4f)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(if (isResponding) "↪️" else "🎯")
                            Text(
                                text = if (isResponding) "Responder" else "Jogar",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (cards.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(112.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "🃏",
                        fontSize = 32.sp,
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "Sem cartas",
                        style = GameTextStyles.InfoText,
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.7f)
                    )
                }
            }
        } else {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(horizontal = 8.dp)
            ) {
                items(cards) { card ->
                    ModernPlayingCard(
                        card = card,
                        isSelected = selectedCard == card,
                        isClickable = canPlay,
                        size = CardSize.NORMAL,
                        onClick = {
                            android.util.Log.d("PlayerCardsSection", "Card clicked: ${card.getDisplayName()}, canPlay: $canPlay")
                            if (canPlay) {
                                onCardClick(card)
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun GameEndSection(
    winner: String?,
    finalScores: Map<String, Int>,
    playerName: String,
    onNewGame: () -> Unit
) {
    val isPlayerWinner = winner == playerName

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = GameShapes.WinnerPanel,
        color = if (isPlayerWinner) {
            WinnerGlow.copy(alpha = 0.1f)
        } else {
            StatusError.copy(alpha = 0.1f)
        }
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = if (isPlayerWinner) "🎉" else "😔",
                fontSize = 48.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = if (isPlayerWinner) "Parabéns!" else "Fim de Jogo",
                style = GameTextStyles.GameTitle.copy(fontSize = 24.sp)
            )

            Text(
                text = if (isPlayerWinner) "Você venceu!" else "O bot venceu desta vez!",
                style = GameTextStyles.GameSubtitle.copy(fontSize = 16.sp),
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onNewGame,
                modifier = Modifier.fillMaxWidth(),
                shape = GameShapes.PrimaryButton
            ) {
                Text("Nova Partida")
            }
        }
    }
}

/**
 * Backwards compatibility wrapper for PlayingCard
 */
@Composable
fun PlayingCard(
    card: Card,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false,
    isClickable: Boolean = true,
    showBack: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    ModernPlayingCard(
        card = card,
        modifier = modifier,
        isSelected = isSelected,
        isClickable = isClickable,
        showBack = showBack,
        onClick = onClick
    )
}

/**
 * Backwards compatibility wrapper for TrumpCard
 */
@Composable
fun TrumpCard(
    card: Card,
    modifier: Modifier = Modifier
) {
    ModernTrumpCard(card = card, modifier = modifier)
}

/**
 * Backwards compatibility wrapper for CardPlaceholder
 */
@Composable
fun CardPlaceholder(
    modifier: Modifier = Modifier,
    label: String = ""
) {
    ModernCardPlaceholder(modifier = modifier, label = label)
}

/**
 * Backwards compatibility wrapper for BotCardArea
 */
@Composable
fun BotCardArea(
    card: Card?,
    isThinking: Boolean = false,
    modifier: Modifier = Modifier
) {
    ModernBotCardArea(card = card, isThinking = isThinking, modifier = modifier)
}

@Composable
private fun LastPlayedCardsSection(
    gameState: com.example.android.data.GameState
) {
    // Use recent plays from GameState
    val recentPlays = gameState.recentPlays

    if (recentPlays.isNotEmpty()) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "📋 Últimas Jogadas",
                    style = GameTextStyles.InfoText,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    items(recentPlays.takeLast(2)) { play ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = if (play.player.contains("Bot")) "🤖 Bot" else "👤 Você",
                                style = GameTextStyles.InfoText.copy(fontSize = 10.sp),
                                modifier = Modifier.padding(bottom = 4.dp)
                            )

                            ModernPlayingCard(
                                card = play.card,
                                isSelected = false,
                                isClickable = false,
                                size = CardSize.SMALL
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Backwards compatibility wrapper for DeckDisplay
 */
@Composable
fun DeckDisplay(
    cardCount: Int,
    trumpCard: Card?,
    modifier: Modifier = Modifier
) {
    ModernDeckDisplay(cardCount = cardCount, trumpCard = trumpCard, modifier = modifier)
}

/**
 * Game timer wrapper
 */
@Composable
fun GameTimer(
    timeRemaining: Int,
    isActive: Boolean,
    isWarning: Boolean = false,
    isDanger: Boolean = false,
    modifier: Modifier = Modifier
) {
    ModernGameTimer(
        timeRemaining = timeRemaining,
        isActive = isActive,
        isDanger = isDanger || isWarning,
        modifier = modifier
    )
}

/**
 * Connection status wrapper
 */
@Composable
fun ConnectionStatus(
    status: com.example.android.data.ConnectionStatus,
    modifier: Modifier = Modifier
) {
    ModernConnectionStatus(status = status, modifier = modifier)
}

/**
 * Score board wrapper
 */
@Composable
fun ScoreBoard(
    playerName: String,
    playerScore: Int,
    botName: String,
    botScore: Int,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = GameShapes.ScorePanel,
        color = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Pontuação",
                style = GameTextStyles.GameSubtitle.copy(fontSize = 14.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "👤 $playerName",
                    style = GameTextStyles.PlayerName.copy(fontSize = 14.sp)
                )
                Text(
                    text = "$playerScore pts",
                    style = GameTextStyles.ScoreNumber.copy(fontSize = 16.sp),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "🤖 $botName",
                    style = GameTextStyles.PlayerName.copy(fontSize = 14.sp)
                )
                Text(
                    text = "$botScore pts",
                    style = GameTextStyles.ScoreNumber.copy(fontSize = 16.sp),
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }
    }
}

/**
 * Game info wrapper
 */
@Composable
fun GameInfo(
    trumpInfo: String,
    deckSize: Int,
    currentRound: Int = 0,
    modifier: Modifier = Modifier
) {
    GameInfoSection(
        trump = trumpInfo,
        deckSize = deckSize,
        scores = emptyMap(),
        playerName = ""
    )
}

/**
 * Game log wrapper
 */
@Composable
fun GameLog(
    logEntries: List<com.example.android.data.GameLogEntry>,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = GameShapes.LogPanel,
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "📋 Log do Jogo",
                style = GameTextStyles.GameSubtitle.copy(fontSize = 16.sp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "${logEntries.size} eventos",
                style = GameTextStyles.InfoText,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}

/**
 * Top bar wrapper
 */
@Composable
fun TopBar(isDark: Boolean, onToggleTheme: () -> Unit) {
    // This is handled in ModernTopBar now
}
