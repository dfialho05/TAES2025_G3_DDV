package com.example.android.data

/**
 * Represents a playing card in the Bisca game
 * Based on CardClass.js from the server
 */
data class Card(
    val suit: String, // c (copas), e (espadas), o (ouros), p (paus)
    val cardFigure: Int, // 1(Ás), 2-7, 11(Valete), 12(Dama), 13(Rei)
    val rank: Int, // Order for comparison (1-10)
    val value: Int, // Points value (0-11)
    val face: String // suit + cardFigure (e.g., "c1", "e7", "o13")
) {
    companion object {
        // Naipes (suits)
        const val COPAS = "c"
        const val ESPADAS = "e"
        const val OUROS = "o"
        const val PAUS = "p"

        val SUITS = listOf(COPAS, ESPADAS, OUROS, PAUS)

        // Card values mapping (based on CardClass.js)
        private val cardValues = mapOf(
            2 to Pair(1, 0),   // Dois
            3 to Pair(2, 0),   // Três
            4 to Pair(3, 0),   // Quatro
            5 to Pair(4, 0),   // Cinco
            6 to Pair(5, 0),   // Seis
            12 to Pair(6, 2),  // Dama
            11 to Pair(7, 3),  // Valete
            13 to Pair(8, 4),  // Rei
            7 to Pair(9, 10),  // Sete
            1 to Pair(10, 11)  // Ás
        )

        /**
         * Create a card from suit and figure
         */
        fun create(suit: String, cardFigure: Int): Card {
            val (rank, value) = cardValues[cardFigure] ?: throw IllegalArgumentException("Invalid card figure: $cardFigure")
            val face = suit + cardFigure
            return Card(suit, cardFigure, rank, value, face)
        }

        /**
         * Create a card from face string (e.g., "c1", "e7")
         */
        fun fromFace(face: String): Card {
            if (face.length < 2) throw IllegalArgumentException("Invalid face: $face")

            val suit = face.substring(0, 1)
            val figureStr = face.substring(1)
            val cardFigure = figureStr.toIntOrNull() ?: throw IllegalArgumentException("Invalid card figure in face: $face")

            return create(suit, cardFigure)
        }

        /**
         * Get all possible cards in a deck
         */
        fun createDeck(): List<Card> {
            val deck = mutableListOf<Card>()
            for (suit in SUITS) {
                for (figure in cardValues.keys) {
                    deck.add(create(suit, figure))
                }
            }
            return deck
        }
    }

    /**
     * Check if this card is trump
     */
    fun isTrump(trumpSuit: String): Boolean = suit == trumpSuit

    /**
     * Check if this card can beat another card
     */
    fun canBeat(other: Card, trumpSuit: String): Boolean {
        return when {
            // Both trump cards - higher rank wins
            this.isTrump(trumpSuit) && other.isTrump(trumpSuit) -> this.rank > other.rank
            // This is trump, other is not - trump wins
            this.isTrump(trumpSuit) && !other.isTrump(trumpSuit) -> true
            // Other is trump, this is not - trump wins
            !this.isTrump(trumpSuit) && other.isTrump(trumpSuit) -> false
            // Same suit - higher rank wins
            this.suit == other.suit -> this.rank > other.rank
            // Different suits, no trump - first card wins (can't beat)
            else -> false
        }
    }

    /**
     * Get display name for the card
     */
    fun getDisplayName(): String {
        val suitName = when (suit) {
            COPAS -> "♥"
            ESPADAS -> "♠"
            OUROS -> "♦"
            PAUS -> "♣"
            else -> suit
        }

        val figureName = when (cardFigure) {
            1 -> "A"
            11 -> "J"
            12 -> "Q"
            13 -> "K"
            else -> cardFigure.toString()
        }

        return "$figureName$suitName"
    }

    /**
     * Get color for UI display
     */
    fun isRed(): Boolean = suit == COPAS || suit == OUROS
}
