package com.example.android.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person

import androidx.compose.material.icons.filled.Warning
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.android.data.GameLogEntry
import com.example.android.data.LogType
import com.example.android.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Modern game timer component with enhanced animations
 */
@Composable
fun ModernGameTimer(
    timeRemaining: Int,
    isActive: Boolean = true,
    isDanger: Boolean = false,
    modifier: Modifier = Modifier
) {
    var pulsePhase by remember { mutableStateOf(0) }

    LaunchedEffect(isDanger) {
        if (isDanger) {
            while (isDanger) {
                delay(500)
                pulsePhase = (pulsePhase + 1) % 2
            }
        }
    }

    val scale by animateFloatAsState(
        targetValue = if (isDanger && pulsePhase == 1) 1.15f else 1.0f,
        animationSpec = tween(durationMillis = 300),
        label = "timer_pulse"
    )

    val backgroundColor = when {
        isDanger -> StatusError
        timeRemaining <= 60 -> StatusWarning
        else -> StatusSuccess
    }

    val gradient = Brush.horizontalGradient(
        colors = listOf(
            backgroundColor,
            backgroundColor.copy(alpha = 0.8f)
        )
    )

    AnimatedVisibility(
        visible = isActive && timeRemaining > 0,
        enter = scaleIn() + fadeIn(),
        exit = scaleOut() + fadeOut()
    ) {
        Surface(
            modifier = modifier.scale(scale),
            shape = GameShapes.Timer,
            color = Color.Transparent
        ) {
            Box(
                modifier = Modifier
                    .background(gradient)
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = if (isDanger) "⚠️" else "⏱️",
                        fontSize = 20.sp
                    )

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "⏱️ Sua vez!",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = formatTime(timeRemaining),
                            color = Color.White,
                            style = GameTextStyles.TimerText,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

/**
 * Modern error overlay component
 */
@Composable
fun ErrorOverlay(
    error: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(OverlayDark),
        contentAlignment = Alignment.TopCenter
    ) {
        AnimatedVisibility(
            visible = true,
            enter = slideInVertically(
                initialOffsetY = { -it },
                animationSpec = tween(300)
            ) + fadeIn(),
            exit = slideOutVertically(
                targetOffsetY = { -it },
                animationSpec = tween(300)
            ) + fadeOut()
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = GameShapes.Notification,
                color = StatusError.copy(alpha = 0.95f),
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = error,
                            color = Color.White,
                            style = GameTextStyles.StatusText,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Modern player name dialog
 */
@Composable
fun PlayerNameDialog(
    playerName: String,
    onPlayerNameChange: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false
        )
    ) {
        Surface(
            shape = GameShapes.Dialog,
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 24.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(
                            MaterialTheme.colorScheme.primaryContainer,
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Bem-vindo ao Bisca!",
                    style = GameTextStyles.GameTitle.copy(fontSize = 20.sp),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Digite seu nome para começar a jogar",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = playerName,
                    onValueChange = onPlayerNameChange,
                    label = { Text("Seu nome") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = GameShapes.ActionButton,
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = GameShapes.ActionButton
                    ) {
                        Text("Cancelar")
                    }

                    Button(
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                        shape = GameShapes.ActionButton,
                        enabled = playerName.isNotBlank()
                    ) {
                        Text("Entrar")
                    }
                }
            }
        }
    }
}

/**
 * Modern game log bottom sheet
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GameLogBottomSheet(
    gameLog: List<GameLogEntry>,
    onDismiss: () -> Unit
) {
    val bottomSheetState = rememberModalBottomSheetState(
        skipPartiallyExpanded = true
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = bottomSheetState,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        dragHandle = {
            Surface(
                modifier = Modifier
                    .padding(vertical = 8.dp)
                    .size(width = 32.dp, height = 4.dp),
                shape = RoundedCornerShape(2.dp),
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
            ) {}
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📋 Log do Jogo",
                    style = GameTextStyles.GameSubtitle,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Text(
                        text = "${gameLog.size}",
                        style = GameTextStyles.InfoText.copy(
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        ),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Log entries
            val listState = rememberLazyListState()
            val coroutineScope = rememberCoroutineScope()

            LaunchedEffect(gameLog.size) {
                if (gameLog.isNotEmpty()) {
                    coroutineScope.launch {
                        listState.animateScrollToItem(gameLog.size - 1)
                    }
                }
            }

            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 400.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(gameLog) { entry ->
                    ModernLogEntry(entry = entry)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Modern log entry component
 */
@Composable
private fun ModernLogEntry(
    entry: GameLogEntry,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor, icon) = when (entry.type) {
        LogType.SUCCESS -> Triple(
            LogSuccess.copy(alpha = 0.1f),
            LogSuccess,
            "✅"
        )
        LogType.ERROR -> Triple(
            LogError.copy(alpha = 0.1f),
            LogError,
            "❌"
        )
        LogType.WARNING -> Triple(
            LogWarning.copy(alpha = 0.1f),
            LogWarning,
            "⚠️"
        )
        LogType.GAME_ACTION -> Triple(
            LogGame.copy(alpha = 0.1f),
            LogGame,
            "🎮"
        )
        LogType.INFO -> Triple(
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurface,
            "ℹ️"
        )
    }

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = GameShapes.LogPanel,
        color = backgroundColor
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Time badge
            Surface(
                shape = CircleShape,
                color = textColor.copy(alpha = 0.2f)
            ) {
                Text(
                    text = formatLogTime(entry.timestamp),
                    style = GameTextStyles.InfoText.copy(
                        fontSize = 10.sp,
                        color = textColor
                    ),
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }

            // Icon
            Text(
                text = icon,
                fontSize = 16.sp
            )

            // Message
            Text(
                text = entry.message,
                style = GameTextStyles.LogEntry.copy(
                    color = textColor
                ),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * Modern loading indicator
 */
@Composable
fun ModernLoadingIndicator(
    message: String = "Carregando...",
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(48.dp),
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 4.dp
        )

        Text(
            text = message,
            style = GameTextStyles.StatusText,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
    }
}

/**
 * Modern success indicator
 */
@Composable
fun ModernSuccessIndicator(
    message: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = GameShapes.Notification,
        color = StatusSuccess.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "✅",
                fontSize = 20.sp
            )

            Text(
                text = message,
                style = GameTextStyles.StatusText.copy(
                    color = StatusSuccess
                )
            )
        }
    }
}

/**
 * Helper functions
 */
private fun formatTime(seconds: Int): String {
    val minutes = seconds / 60
    val remainingSeconds = seconds % 60
    return String.format("%d:%02d", minutes, remainingSeconds)
}

private fun formatLogTime(timestamp: Long): String {
    val now = System.currentTimeMillis()
    val diff = (now - timestamp) / 1000
    return when {
        diff < 60 -> "${diff}s"
        diff < 3600 -> "${diff / 60}m"
        else -> "${diff / 3600}h"
    }
}
