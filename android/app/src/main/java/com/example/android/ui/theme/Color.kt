package com.example.android.ui.theme

import androidx.compose.ui.graphics.Color

// Cores principais do tema Bisca
val BiscaGreen = Color(0xFF0F766E)      // Verde principal (similar ao feltro de cartas)
val BiscaGreenLight = Color(0xFF14B8A6) // Verde claro
val BiscaGreenDark = Color(0xFF0D9488)  // Verde escuro

val BiscaGold = Color(0xFFF59E0B)       // Dourado para destaques
val BiscaGoldLight = Color(0xFFFBBF24) // Dourado claro
val BiscaGoldDark = Color(0xFFD97706)   // Dourado escuro

// Cores das cartas
val CardRed = Color(0xFFDC2626)         // Vermelho das cartas (Copas/Ouros)
val CardBlack = Color(0xFF1F2937)       // Preto das cartas (Espadas/Paus)
val CardBackground = Color(0xFFFAFAFA)  // Fundo das cartas

// Cores de status
val StatusSuccess = Color(0xFF10B981)   // Verde sucesso
val StatusWarning = Color(0xFFF59E0B)   // Amarelo aviso
val StatusError = Color(0xFFEF4444)     // Vermelho erro
val StatusInfo = Color(0xFF3B82F6)      // Azul informação

// Cores neutras modernas
val Gray50 = Color(0xFFFAFAFA)
val Gray100 = Color(0xFFF4F4F5)
val Gray200 = Color(0xFFE4E4E7)
val Gray300 = Color(0xFFD4D4D8)
val Gray400 = Color(0xFFA1A1AA)
val Gray500 = Color(0xFF71717A)
val Gray600 = Color(0xFF52525B)
val Gray700 = Color(0xFF3F3F46)
val Gray800 = Color(0xFF27272A)
val Gray900 = Color(0xFF18181B)

// Cores de fundo
val BackgroundLight = Color(0xFFFAFBFC)
val BackgroundDark = Color(0xFF0F1419)
val SurfaceLight = Color(0xFFFFFFFF)
val SurfaceDark = Color(0xFF1A1D23)

// Cores específicas do jogo
val TableGreen = Color(0xFF166534)      // Verde da mesa de cartas
val ChipGold = Color(0xFFCA8A04)        // Dourado das fichas
val TimerRed = Color(0xFFDC2626)        // Vermelho do timer urgente
val SelectionBlue = Color(0xFF2563EB)   // Azul para seleção de cartas

// Cores com transparência
val OverlayLight = Color(0x80FFFFFF)
val OverlayDark = Color(0x80000000)
val CardShadow = Color(0x1A000000)

// Gradientes (cores base para gradientes)
val GradientStart = BiscaGreen
val GradientEnd = BiscaGreenDark
val GoldGradientStart = BiscaGold
val GoldGradientEnd = BiscaGoldDark

// Cores do tema claro
val LightPrimary = BiscaGreen
val LightOnPrimary = Color.White
val LightPrimaryContainer = BiscaGreenLight
val LightOnPrimaryContainer = Color.White

val LightSecondary = BiscaGold
val LightOnSecondary = Color.White
val LightSecondaryContainer = BiscaGoldLight
val LightOnSecondaryContainer = Gray900

val LightTertiary = SelectionBlue
val LightOnTertiary = Color.White
val LightTertiaryContainer = Color(0xFFDEF7FF)
val LightOnTertiaryContainer = Color(0xFF001F2A)

val LightBackground = BackgroundLight
val LightOnBackground = Gray900
val LightSurface = SurfaceLight
val LightOnSurface = Gray900
val LightSurfaceVariant = Gray100
val LightOnSurfaceVariant = Gray700

val LightOutline = Gray300
val LightOutlineVariant = Gray200

// Cores do tema escuro
val DarkPrimary = BiscaGreenLight
val DarkOnPrimary = Gray900
val DarkPrimaryContainer = BiscaGreenDark
val DarkOnPrimaryContainer = Color.White

val DarkSecondary = BiscaGoldLight
val DarkOnSecondary = Gray900
val DarkSecondaryContainer = BiscaGoldDark
val DarkOnSecondaryContainer = Color.White

val DarkTertiary = Color(0xFF6DD3F7)
val DarkOnTertiary = Color(0xFF003544)
val DarkTertiaryContainer = Color(0xFF004D61)
val DarkOnTertiaryContainer = Color(0xFFBDE9FF)

val DarkBackground = BackgroundDark
val DarkOnBackground = Gray100
val DarkSurface = SurfaceDark
val DarkOnSurface = Gray100
val DarkSurfaceVariant = Gray800
val DarkOnSurfaceVariant = Gray300

val DarkOutline = Gray600
val DarkOutlineVariant = Gray700

// Cores especiais para elementos do jogo
val TrumpCardBorder = BiscaGold
val SelectedCardBorder = SelectionBlue
val WinnerGlow = StatusSuccess
val LoserMuted = Gray400
val BotThinking = Color(0xFFFEF3C7)
val PlayerTurn = Color(0xFFDCFDF7)

// Cores para tipos de log
val LogSuccess = StatusSuccess
val LogError = StatusError
val LogWarning = StatusWarning
val LogInfo = StatusInfo
val LogGame = SelectionBlue
