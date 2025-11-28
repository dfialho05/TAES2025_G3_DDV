package com.example.android.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.android.data.GameLogEntry
import com.example.android.data.LogType
import kotlinx.coroutines.launch

/**
 * Timer component for player turns
 */
@Composable
fun GameTimer(
    timeRemaining: Int,
    isActive: Boolean,
    isWarning: Boolean = false,
    isDanger: Boolean = false,
    modifier: Modifier = Modifier
) {
    val scale by animateFloatAsState(
        targetValue = if (isDanger) 1.1f else 1.0f,
        animationSpec = tween(durationMillis = 500),
        label = "timer_scale"
    )

    val backgroundColor = when {
        isDanger -> Color(0xFFDC2626) // Red
        isWarning -> Color(0xFFF59E0B) // Yellow
        else -> Color(0xFF10B981) // Green
    }

    if (isActive && timeRemaining > 0) {
        Card(
            modifier = modifier.scale(scale),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = backgroundColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (isDanger) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Warning",
                        tint = Color.White
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "⏱️ Sua vez!",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = formatTime(timeRemaining),
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

/**
 * Score display component
 */
@Composable
fun ScoreBoard(
    playerName: String,
    playerScore: Int,
    botName: String,
    botScore: Int,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Pontuação",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Player score
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "👤 $playerName",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$playerScore pts",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Bot score
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🤖 $botName",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$botScore pts",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Leader indicator
            val leader = when {
                playerScore > botScore -> playerName
                botScore > playerScore -> botName
                else -> null
            }

            if (leader != null) {
                Text(
                    text = "🏆 $leader está na frente!",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            } else {
                Text(
                    text = "🤝 Empate",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

/**
 * Game information display
 */
@Composable
fun GameInfo(
    trumpInfo: String,
    deckSize: Int,
    currentRound: Int = 0,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Informações do Jogo",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Trunfo",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                    )
                    Text(
                        text = trumpInfo,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Cartas no Baralho",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "$deckSize",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }

            if (currentRound > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Rodada $currentRound",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                )
            }
        }
    }
}

/**
 * Game log component
 */
@Composable
fun GameLog(
    logEntries: List<GameLogEntry>,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Auto-scroll to bottom when new entries are added
    LaunchedEffect(logEntries.size) {
        if (logEntries.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(logEntries.size - 1)
            }
        }
    }

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Log do Jogo",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${logEntries.size} eventos",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                state = listState,
                modifier = Modifier.height(200.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(logEntries) { entry ->
                    LogEntry(entry = entry)
                }
            }
        }
    }
}

/**
 * Individual log entry component
 */
@Composable
private fun LogEntry(
    entry: GameLogEntry,
    modifier: Modifier = Modifier
) {
    val backgroundColor = when (entry.type) {
        LogType.SUCCESS -> Color(0xFF10B981).copy(alpha = 0.1f)
        LogType.ERROR -> Color(0xFFDC2626).copy(alpha = 0.1f)
        LogType.WARNING -> Color(0xFFF59E0B).copy(alpha = 0.1f)
        LogType.GAME_ACTION -> Color(0xFF3B82F6).copy(alpha = 0.1f)
        LogType.INFO -> Color.Transparent
    }

    val textColor = when (entry.type) {
        LogType.SUCCESS -> Color(0xFF059669)
        LogType.ERROR -> Color(0xFFDC2626)
        LogType.WARNING -> Color(0xFFD97706)
        LogType.GAME_ACTION -> Color(0xFF2563EB)
        LogType.INFO -> MaterialTheme.colorScheme.onSurface
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(backgroundColor, RoundedCornerShape(6.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = formatLogTime(entry.timestamp),
            fontSize = 10.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            modifier = Modifier.width(50.dp)
        )

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = entry.message,
            fontSize = 12.sp,
            color = textColor,
            modifier = Modifier.weight(1f)
        )
    }
}

/**
 * Connection status indicator
 */
@Composable
fun ConnectionStatus(
    status: com.example.android.data.ConnectionStatus,
    modifier: Modifier = Modifier
) {
    val (text, color) = when (status) {
        com.example.android.data.ConnectionStatus.DISCONNECTED -> "❌ Desconectado" to Color(0xFFDC2626)
        com.example.android.data.ConnectionStatus.CONNECTING -> "🔄 Conectando..." to Color(0xFFF59E0B)
        com.example.android.data.ConnectionStatus.CONNECTED -> "✅ Conectado" to Color(0xFF10B981)
        com.example.android.data.ConnectionStatus.AUTHENTICATED -> "✅ Autenticado" to Color(0xFF10B981)
        com.example.android.data.ConnectionStatus.IN_GAME -> "🎮 Em jogo" to Color(0xFF3B82F6)
        com.example.android.data.ConnectionStatus.ERROR -> "❌ Erro" to Color(0xFFDC2626)
    }

    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(20.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
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
