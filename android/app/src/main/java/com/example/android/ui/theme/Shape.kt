package com.example.android.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val BiscaShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

// Custom shapes for game elements
object GameShapes {
    // Playing cards - slightly rounded corners
    val Card = RoundedCornerShape(8.dp)

    // Selected card - more rounded for emphasis
    val CardSelected = RoundedCornerShape(12.dp)

    // Trump card display
    val TrumpCard = RoundedCornerShape(6.dp)

    // Game table/surface areas
    val GameSurface = RoundedCornerShape(20.dp)

    // Score panels
    val ScorePanel = RoundedCornerShape(16.dp)

    // Timer component
    val Timer = RoundedCornerShape(24.dp)

    // Status indicators (connection, game state)
    val StatusIndicator = RoundedCornerShape(20.dp)

    // Game log panel
    val LogPanel = RoundedCornerShape(12.dp)

    // Action buttons
    val ActionButton = RoundedCornerShape(12.dp)

    // Primary game buttons (Start Game, Play Card, etc.)
    val PrimaryButton = RoundedCornerShape(16.dp)

    // Dialog boxes
    val Dialog = RoundedCornerShape(24.dp)

    // Card placeholder/slot
    val CardSlot = RoundedCornerShape(8.dp)

    // Game area sections
    val GameSection = RoundedCornerShape(16.dp)

    // Player info panels
    val PlayerPanel = RoundedCornerShape(14.dp)

    // Bot thinking indicator
    val BotThinking = RoundedCornerShape(10.dp)

    // Notification/toast messages
    val Notification = RoundedCornerShape(8.dp)

    // Settings panel
    val SettingsPanel = RoundedCornerShape(16.dp)

    // Game lobby/waiting room
    val LobbyPanel = RoundedCornerShape(20.dp)

    // Card deck representation
    val Deck = RoundedCornerShape(6.dp)

    // Winner announcement panel
    val WinnerPanel = RoundedCornerShape(24.dp)
}

// Backwards compatibility
val Shapes = BiscaShapes
