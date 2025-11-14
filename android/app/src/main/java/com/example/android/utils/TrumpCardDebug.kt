package com.example.android.utils

import android.util.Log
import com.example.android.data.Card

/**
 * Debug utility for trump card issues
 */
object TrumpCardDebug {
    private const val TAG = "TrumpCardDebug"

    /**
     * Log detailed trump card information
     */
    fun logTrumpCardInfo(
        trump: String,
        trumpCard: Card?,
        context: String = "Unknown"
    ) {
        Log.d(TAG, "=== TRUMP CARD DEBUG [$context] ===")
        Log.d(TAG, "Trump suit: '$trump'")
        Log.d(TAG, "Trump card object: ${if (trumpCard != null) "EXISTS" else "NULL"}")

        trumpCard?.let { card ->
            Log.d(TAG, "Card suit: '${card.suit}'")
            Log.d(TAG, "Card figure: ${card.cardFigure}")
            Log.d(TAG, "Card face: '${card.face}'")
            Log.d(TAG, "Card display name: '${card.getDisplayName()}'")
            Log.d(TAG, "Card is red: ${card.isRed()}")
            Log.d(TAG, "Card rank: ${card.rank}")
            Log.d(TAG, "Card value: ${card.value}")
        }
        Log.d(TAG, "================================")
    }

    /**
     * Validate trump card creation
     */
    fun validateTrumpCard(trump: String): Card? {
        return try {
            when (trump.lowercase().trim()) {
                "c", "copas" -> {
                    val card = Card.create(Card.COPAS, 7)
                    Log.d(TAG, "Created COPAS trump card: ${card.getDisplayName()}")
                    card
                }
                "e", "espadas" -> {
                    val card = Card.create(Card.ESPADAS, 7)
                    Log.d(TAG, "Created ESPADAS trump card: ${card.getDisplayName()}")
                    card
                }
                "o", "ouros" -> {
                    val card = Card.create(Card.OUROS, 7)
                    Log.d(TAG, "Created OUROS trump card: ${card.getDisplayName()}")
                    card
                }
                "p", "paus" -> {
                    val card = Card.create(Card.PAUS, 7)
                    Log.d(TAG, "Created PAUS trump card: ${card.getDisplayName()}")
                    card
                }
                else -> {
                    Log.w(TAG, "Unknown trump suit: '$trump', using fallback")
                    Card.create(Card.COPAS, 7)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating trump card for suit '$trump'", e)
            null
        }
    }

    /**
     * Test trump card resource loading
     */
    fun testTrumpCardResources(trump: String): List<String> {
        val availableCards = mutableListOf<String>()

        // Test different card figures for the trump suit
        val figures = listOf(1, 2, 3, 4, 5, 6, 7, 11, 12, 13)

        for (figure in figures) {
            val face = "$trump$figure"
            availableCards.add("card_$face")
            Log.d(TAG, "Testing resource: card_$face")
        }

        return availableCards
    }

    /**
     * Get suit symbol with fallback
     */
    fun getSuitSymbolSafe(suit: String): String {
        return when (suit.lowercase().trim()) {
            "c", "copas" -> "♥"
            "e", "espadas" -> "♠"
            "o", "ouros" -> "♦"
            "p", "paus" -> "♣"
            else -> {
                Log.w(TAG, "Unknown suit for symbol: '$suit'")
                "?"
            }
        }
    }

    /**
     * Parse trump from server format with extensive logging
     */
    fun parseTrumpFromServer(serverTrump: String): Pair<String, Card?> {
        Log.d(TAG, "Parsing trump from server: '$serverTrump'")

        var trump = ""
        var trumpCard: Card? = null

        try {
            when {
                serverTrump.contains(" - ") -> {
                    val parts = serverTrump.split(" - ")
                    trump = parts[0].trim()
                    if (parts.size > 1) {
                        val cardFace = parts[1].trim()
                        Log.d(TAG, "Attempting to create card from face: '$cardFace'")
                        trumpCard = Card.fromFace(cardFace)
                        Log.d(TAG, "Successfully created trump card: ${trumpCard.getDisplayName()}")
                    }
                }
                serverTrump.contains("-") -> {
                    val parts = serverTrump.split("-")
                    trump = parts[0].trim()
                    if (parts.size > 1) {
                        val cardFace = parts[1].trim()
                        Log.d(TAG, "Attempting to create card from face (no spaces): '$cardFace'")
                        trumpCard = Card.fromFace(cardFace)
                        Log.d(TAG, "Successfully created trump card: ${trumpCard.getDisplayName()}")
                    }
                }
                else -> {
                    trump = serverTrump.trim()
                    Log.d(TAG, "Simple trump suit format: '$trump'")
                    // Create a representative card
                    trumpCard = validateTrumpCard(trump)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing trump from server format '$serverTrump'", e)
            trump = if (trump.isEmpty()) "c" else trump
            trumpCard = validateTrumpCard(trump)
        }

        logTrumpCardInfo(trump, trumpCard, "ParsedFromServer")
        return Pair(trump, trumpCard)
    }

    /**
     * Debug card resource loading
     */
    fun debugCardResource(card: Card): String {
        val resourceName = "card_${card.face}"
        Log.d(TAG, "Looking for resource: $resourceName")
        Log.d(TAG, "Card face: '${card.face}'")
        Log.d(TAG, "Expected format: [suit][figure] (e.g., c1, e7, o13)")
        return resourceName
    }
}
