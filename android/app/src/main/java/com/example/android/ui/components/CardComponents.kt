package com.example.android.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.android.data.Card
import com.example.android.ui.theme.*

/**
 * Modern playing card component with actual card images
 */
@Composable
fun ModernPlayingCard(
    card: Card,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false,
    isClickable: Boolean = true,
    showBack: Boolean = false,
    onClick: (() -> Unit)? = null,
    size: CardSize = CardSize.NORMAL
) {
    val scale by animateFloatAsState(
        targetValue = if (isSelected) 1.05f else 1.0f,
        animationSpec = tween(durationMillis = 200),
        label = "card_scale"
    )

    val elevation by animateFloatAsState(
        targetValue = if (isSelected) 12f else 4f,
        animationSpec = tween(durationMillis = 200),
        label = "card_elevation"
    )

    val rotation by animateFloatAsState(
        targetValue = if (isSelected) -2f else 0f,
        animationSpec = tween(durationMillis = 200),
        label = "card_rotation"
    )

    val (cardWidth, cardHeight) = when (size) {
        CardSize.SMALL -> 60.dp to 84.dp
        CardSize.NORMAL -> 80.dp to 112.dp
        CardSize.LARGE -> 100.dp to 140.dp
    }

    Card(
        modifier = modifier
            .size(width = cardWidth, height = cardHeight)
            .scale(scale)
            .graphicsLayer {
                shadowElevation = elevation
                rotationZ = rotation
            }
            .then(
                if (isClickable && onClick != null) {
                    Modifier.clickable { onClick() }
                } else {
                    Modifier
                }
            ),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        border = when {
            isSelected -> BorderStroke(3.dp, Color(0xFF2563EB))
            else -> BorderStroke(1.dp, Color(0xFFE5E7EB))
        }
    ) {
        if (showBack) {
            CardBackImage()
        } else {
            CardImage(card = card)
        }
    }
}

/**
 * Display card back image
 */
@Composable
private fun CardBackImage() {
    val context = LocalContext.current
    val cardBackResourceId = context.resources.getIdentifier(
        "card_semface",
        "drawable",
        context.packageName
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        if (cardBackResourceId != 0) {
            Image(
                painter = painterResource(id = cardBackResourceId),
                contentDescription = "Card Back",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit
            )
        } else {
            // Fallback if image not found
            CardBackFallback()
        }
    }
}

/**
 * Display actual card image
 */
@Composable
private fun CardImage(card: Card) {
    val context = LocalContext.current
    val cardResourceName = "card_${card.face}"
    val cardResourceId = context.resources.getIdentifier(
        cardResourceName,
        "drawable",
        context.packageName
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        if (cardResourceId != 0) {
            Image(
                painter = painterResource(id = cardResourceId),
                contentDescription = "${card.getDisplayName()} of ${getSuitName(card.suit)}",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit
            )
        } else {
            // Fallback if image not found
            CardFrontFallback(card = card)
        }
    }
}

/**
 * Fallback card back design
 */
@Composable
private fun CardBackFallback() {
    val gradient = Brush.radialGradient(
        colors = listOf(
            Color(0xFF059669),
            Color(0xFF047857),
            Color(0xFF065F46)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradient),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "BISCA",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "♠♥♦♣",
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(Color.White.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🎴",
                    fontSize = 12.sp
                )
            }
        }
    }
}

/**
 * Fallback card front design (if image not found)
 */
@Composable
private fun CardFrontFallback(card: Card) {
    val cardColor = if (card.isRed()) Color(0xFFDC2626) else Color.Black

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(4.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top left corner
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = card.getDisplayValue(),
                    color = cardColor,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = getSuitSymbol(card.suit),
                    color = cardColor,
                    fontSize = 11.sp
                )
            }
        }

        // Center symbol
        Box(
            modifier = Modifier.align(Alignment.CenterHorizontally),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = getSuitSymbol(card.suit),
                color = cardColor,
                fontSize = 32.sp
            )
        }

        // Bottom right corner (rotated)
        Row(
            modifier = Modifier.align(Alignment.End),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.graphicsLayer { rotationZ = 180f }
            ) {
                Text(
                    text = card.getDisplayValue(),
                    color = cardColor,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = getSuitSymbol(card.suit),
                    color = cardColor,
                    fontSize = 11.sp
                )
            }
        }
    }
}

/**
 * Modern trump card display
 */
@Composable
fun ModernTrumpCard(
    card: Card,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.size(width = 70.dp, height = 98.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(2.dp, Color(0xFFFBBF24))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceEvenly
        ) {
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = Color(0xFFFBBF24)
            ) {
                Text(
                    text = "TRUMP",
                    color = Color.White,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                )
            }

            // Try to show part of the actual card image
            val context = LocalContext.current
            val cardResourceName = "card_${card.face}"
            val cardResourceId = context.resources.getIdentifier(
                cardResourceName,
                "drawable",
                context.packageName
            )

            if (cardResourceId != 0) {
                Image(
                    painter = painterResource(id = cardResourceId),
                    contentDescription = "Trump ${card.getDisplayName()}",
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .clip(RoundedCornerShape(4.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                // Fallback
                Text(
                    text = getSuitSymbol(card.suit),
                    color = if (card.isRed()) Color(0xFFDC2626) else Color.Black,
                    fontSize = 28.sp
                )
            }

            Text(
                text = card.getDisplayValue(),
                color = if (card.isRed()) Color(0xFFDC2626) else Color.Black,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Modern card placeholder
 */
@Composable
fun ModernCardPlaceholder(
    modifier: Modifier = Modifier,
    label: String = "",
    size: CardSize = CardSize.NORMAL
) {
    val (cardWidth, cardHeight) = when (size) {
        CardSize.SMALL -> 60.dp to 84.dp
        CardSize.NORMAL -> 80.dp to 112.dp
        CardSize.LARGE -> 100.dp to 140.dp
    }

    Card(
        modifier = modifier.size(width = cardWidth, height = cardHeight),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent
        ),
        border = BorderStroke(
            2.dp,
            Color(0xFF9CA3AF).copy(alpha = 0.5f)
        )
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🃏",
                    fontSize = 24.sp,
                    color = Color(0xFF9CA3AF).copy(alpha = 0.5f)
                )
                if (label.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = label,
                        color = Color(0xFF9CA3AF).copy(alpha = 0.7f),
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

/**
 * Modern bot card area with thinking animation
 */
@Composable
fun ModernBotCardArea(
    card: Card?,
    isThinking: Boolean = false,
    modifier: Modifier = Modifier
) {
    when {
        isThinking -> {
            AnimatedThinkingCard()
        }
        card != null -> {
            AnimatedVisibility(
                visible = true,
                enter = scaleIn() + fadeIn(),
                exit = scaleOut() + fadeOut()
            ) {
                ModernPlayingCard(
                    card = card,
                    isClickable = false,
                    modifier = modifier
                )
            }
        }
        else -> {
            ModernCardPlaceholder(
                label = "Aguardando\nBot",
                modifier = modifier
            )
        }
    }
}

/**
 * Animated thinking card for bot
 */
@Composable
private fun AnimatedThinkingCard() {
    var animationPhase by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(500)
            animationPhase = (animationPhase + 1) % 3
        }
    }

    val scale by animateFloatAsState(
        targetValue = if (animationPhase == 1) 1.1f else 1.0f,
        animationSpec = tween(durationMillis = 500),
        label = "thinking_scale"
    )

    Card(
        modifier = Modifier
            .size(width = 80.dp, height = 112.dp)
            .scale(scale),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFFEF3C7)
        ),
        border = BorderStroke(2.dp, Color(0xFFFBBF24))
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = when (animationPhase) {
                        0 -> "🤔"
                        1 -> "💭"
                        else -> "⏳"
                    },
                    fontSize = 32.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Pensando...",
                    fontSize = 10.sp,
                    color = Color(0xFFD97706),
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

/**
 * Modern deck display
 */
@Composable
fun ModernDeckDisplay(
    cardCount: Int,
    trumpCard: Card?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = Color(0xFF374151).copy(alpha = 0.3f)
        ) {
            Text(
                text = "Baralho",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Box {
            // Deck cards (stacked effect)
            repeat(3) { index ->
                ModernPlayingCard(
                    card = Card.create(Card.PAUS, 2), // Dummy card for back
                    showBack = true,
                    isClickable = false,
                    size = CardSize.SMALL,
                    modifier = Modifier.offset(
                        x = (index * 2).dp,
                        y = (index * -2).dp
                    )
                )
            }

            // Trump card (partially visible)
            if (trumpCard != null) {
                ModernTrumpCard(
                    card = trumpCard,
                    modifier = Modifier.offset(x = 20.dp, y = 14.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            shape = CircleShape,
            color = Color(0xFF2563EB)
        ) {
            Text(
                text = "$cardCount",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

/**
 * Card size enum
 */
enum class CardSize {
    SMALL, NORMAL, LARGE
}

/**
 * Get suit symbol for display
 */
private fun getSuitSymbol(suit: String): String {
    return when (suit) {
        Card.COPAS -> "♥"
        Card.ESPADAS -> "♠"
        Card.OUROS -> "♦"
        Card.PAUS -> "♣"
        else -> suit
    }
}

/**
 * Get suit name for accessibility
 */
private fun getSuitName(suit: String): String {
    return when (suit) {
        Card.COPAS -> "Hearts"
        Card.ESPADAS -> "Spades"
        Card.OUROS -> "Diamonds"
        Card.PAUS -> "Clubs"
        else -> suit
    }
}

/**
 * Check if card is red
 */
private fun Card.isRed(): Boolean {
    return this.suit == Card.COPAS || this.suit == Card.OUROS
}

/**
 * Extension function to get display value
 */
private fun Card.getDisplayValue(): String {
    return when (this.cardFigure) {
        1 -> "A"
        11 -> "J"
        12 -> "Q"
        13 -> "K"
        else -> this.cardFigure.toString()
    }
}

/**
 * Extension function to get display name
 */
private fun Card.getDisplayName(): String {
    val figureName = when (this.cardFigure) {
        1 -> "Ace"
        11 -> "Jack"
        12 -> "Queen"
        13 -> "King"
        else -> this.cardFigure.toString()
    }
    return figureName
}
