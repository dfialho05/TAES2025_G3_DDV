<?php

namespace App\Services\Game;

use App\Models\User;
use App\Models\Game;
use App\Models\Matches;
use App\Services\CoinTransactionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameStakeService
{
    protected CoinTransactionService $coinService;

    // Stake values
    const MATCH_STAKE = 10; // 10 coins per player for matches
    const GAME_STAKE = 2; // 2 coins per player for standalone games

    public function __construct(CoinTransactionService $coinService)
    {
        $this->coinService = $coinService;
    }

    /**
     * Process entry fees for a match
     * Charges both players (or just human player if vs BOT)
     *
     * @param Matches $match
     * @return array ['success' => bool, 'message' => string, 'pot' => int]
     */
    public function processMatchEntry(Matches $match): array
    {
        try {
            DB::beginTransaction();

            $player1 = User::findOrFail($match->player1_user_id);

            $totalPot = 0;

            // Charge player 1 (always human)
            $this->coinService->createDebitTransaction(
                $player1,
                "Match stake",
                self::MATCH_STAKE,
                ["match_id" => $match->id],
                [
                    "match_type" => $match->type,
                    "opponent_id" => $match->player2_user_id,
                    "stake_amount" => self::MATCH_STAKE,
                ],
            );
            $totalPot += self::MATCH_STAKE;

            // Charge player 2 only if NOT BOT
            if ($match->player2_user_id !== 0) {
                $player2 = User::find($match->player2_user_id);
                if ($player2 && !$player2->isBot()) {
                    $this->coinService->createDebitTransaction(
                        $player2,
                        "Match stake",
                        self::MATCH_STAKE,
                        ["match_id" => $match->id],
                        [
                            "match_type" => $match->type,
                            "opponent_id" => $match->player1_user_id,
                            "stake_amount" => self::MATCH_STAKE,
                        ],
                    );
                    $totalPot += self::MATCH_STAKE;
                }
            }

            DB::commit();

            Log::info("[GameStakeService] Match entry fees processed", [
                "match_id" => $match->id,
                "player1_id" => $match->player1_user_id,
                "player2_id" => $match->player2_user_id,
                "is_bot_match" => $match->player2_user_id === 0,
                "total_pot" => $totalPot,
            ]);

            return [
                "success" => true,
                "message" => "Entry fees charged successfully",
                "pot" => $totalPot,
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameStakeService] Error processing match entry", [
                "match_id" => $match->id,
                "error" => $e->getMessage(),
            ]);

            return [
                "success" => false,
                "message" => $e->getMessage(),
                "pot" => 0,
            ];
        }
    }

    /**
     * Process entry fees for a standalone game
     * Charges both players (or just human player if vs BOT)
     * If game belongs to a match, uses match stake values and transaction types
     *
     * @param Game $game
     * @return array ['success' => bool, 'message' => string, 'pot' => int]
     */
    public function processGameEntry(Game $game): array
    {
        try {
            DB::beginTransaction();

            $player1 = User::findOrFail($game->player1_user_id);

            // Determine if this game is part of a match
            $isMatchGame = $game->match_id !== null;
            $stakeAmount = $isMatchGame ? self::MATCH_STAKE : self::GAME_STAKE;
            $transactionType = $isMatchGame ? "Match stake" : "Game fee";
            $relatedIdKey = $isMatchGame ? "match_id" : "game_id";
            $relatedIdValue = $isMatchGame ? $game->match_id : $game->id;

            $totalPot = 0;

            // Charge player 1 (always human)
            $this->coinService->createDebitTransaction(
                $player1,
                $transactionType,
                $stakeAmount,
                [$relatedIdKey => $relatedIdValue],
                [
                    "game_type" => $game->type,
                    "opponent_id" => $game->player2_user_id,
                    "stake_amount" => $stakeAmount,
                    "is_match_game" => $isMatchGame,
                ],
            );
            $totalPot += $stakeAmount;

            // Charge player 2 only if NOT BOT
            if ($game->player2_user_id !== 0) {
                $player2 = User::find($game->player2_user_id);
                if ($player2 && !$player2->isBot()) {
                    $this->coinService->createDebitTransaction(
                        $player2,
                        $transactionType,
                        $stakeAmount,
                        [$relatedIdKey => $relatedIdValue],
                        [
                            "game_type" => $game->type,
                            "opponent_id" => $game->player1_user_id,
                            "stake_amount" => $stakeAmount,
                            "is_match_game" => $isMatchGame,
                        ],
                    );
                    $totalPot += $stakeAmount;
                }
            }

            DB::commit();

            Log::info("[GameStakeService] Game entry fees processed", [
                "game_id" => $game->id,
                "match_id" => $game->match_id,
                "is_match_game" => $isMatchGame,
                "stake_amount" => $stakeAmount,
                "player1_id" => $game->player1_user_id,
                "player2_id" => $game->player2_user_id,
                "is_bot_game" => $game->player2_user_id === 0,
                "total_pot" => $totalPot,
            ]);

            return [
                "success" => true,
                "message" => "Entry fees charged successfully",
                "pot" => $totalPot,
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameStakeService] Error processing game entry", [
                "game_id" => $game->id,
                "match_id" => $game->match_id ?? null,
                "error" => $e->getMessage(),
            ]);

            return [
                "success" => false,
                "message" => $e->getMessage(),
                "pot" => 0,
            ];
        }
    }

    /**
     * Process match payout to winner
     *
     * @param Matches $match
     * @param int $winnerId
     * @param int $loserId
     * @return array ['success' => bool, 'message' => string, 'payout' => int]
     */
    public function processMatchPayout(
        Matches $match,
        int $winnerId,
        int $loserId,
    ): array {
        try {
            $winner = User::findOrFail($winnerId);

            // Don't pay the BOT
            if ($winner->isBot() || $winnerId === 0) {
                Log::info("[GameStakeService] BOT won match, no payout", [
                    "match_id" => $match->id,
                    "winner_id" => $winnerId,
                ]);

                return [
                    "success" => true,
                    "message" => "BOT won, no payout",
                    "payout" => 0,
                ];
            }

            $isBotMatch =
                $match->player1_user_id === 0 || $match->player2_user_id === 0;
            $totalPot = $isBotMatch
                ? self::MATCH_STAKE * 2
                : self::MATCH_STAKE * 2;

            $this->coinService->createCreditTransaction(
                $winner,
                "Match payout",
                $totalPot,
                ["match_id" => $match->id],
                [
                    "match_type" => $match->type,
                    "defeated_opponent_id" => $loserId,
                    "original_stake" => self::MATCH_STAKE,
                    "is_bot_match" => $isBotMatch,
                    "total_payout" => $totalPot,
                ],
            );

            Log::info("[GameStakeService] Match payout processed", [
                "match_id" => $match->id,
                "winner_id" => $winnerId,
                "payout_amount" => $totalPot,
                "is_bot_match" => $isBotMatch,
            ]);

            return [
                "success" => true,
                "message" => "Payout processed successfully",
                "payout" => $totalPot,
            ];
        } catch (\Exception $e) {
            Log::error("[GameStakeService] Error processing match payout", [
                "match_id" => $match->id,
                "winner_id" => $winnerId,
                "error" => $e->getMessage(),
            ]);

            return [
                "success" => false,
                "message" => $e->getMessage(),
                "payout" => 0,
            ];
        }
    }

    /**
     * Process game payout to winner
     * If game belongs to a match, uses match payout values and transaction types
     *
     * @param Game $game
     * @param int $winnerId
     * @param int $loserId
     * @return array ['success' => bool, 'message' => string, 'payout' => int]
     */
    public function processGamePayout(
        Game $game,
        int $winnerId,
        int $loserId,
    ): array {
        try {
            $winner = User::findOrFail($winnerId);

            // Don't pay the BOT
            if ($winner->isBot() || $winnerId === 0) {
                Log::info("[GameStakeService] BOT won game, no payout", [
                    "game_id" => $game->id,
                    "match_id" => $game->match_id ?? null,
                    "winner_id" => $winnerId,
                ]);

                return [
                    "success" => true,
                    "message" => "BOT won, no payout",
                    "payout" => 0,
                ];
            }

            // Determine if this game is part of a match
            $isMatchGame = $game->match_id !== null;
            $isBotGame =
                $game->player1_user_id === 0 || $game->player2_user_id === 0;

            // Calculate payout based on whether it's a match game or standalone
            if ($isMatchGame) {
                $totalPot = $isBotGame
                    ? self::MATCH_STAKE * 2
                    : self::MATCH_STAKE * 2;
                $transactionType = "Match payout";
                $relatedIdKey = "match_id";
                $relatedIdValue = $game->match_id;
                $originalStake = self::MATCH_STAKE;
            } else {
                $totalPot = $isBotGame
                    ? self::GAME_STAKE * 2
                    : self::GAME_STAKE * 2;
                $transactionType = "Game payout";
                $relatedIdKey = "game_id";
                $relatedIdValue = $game->id;
                $originalStake = self::GAME_STAKE;
            }

            $this->coinService->createCreditTransaction(
                $winner,
                $transactionType,
                $totalPot,
                [$relatedIdKey => $relatedIdValue],
                [
                    "game_type" => $game->type,
                    "defeated_opponent_id" => $loserId,
                    "original_stake" => $originalStake,
                    "is_bot_game" => $isBotGame,
                    "is_match_game" => $isMatchGame,
                    "total_payout" => $totalPot,
                ],
            );

            Log::info("[GameStakeService] Game payout processed", [
                "game_id" => $game->id,
                "match_id" => $game->match_id ?? null,
                "is_match_game" => $isMatchGame,
                "winner_id" => $winnerId,
                "payout_amount" => $totalPot,
                "is_bot_game" => $isBotGame,
            ]);

            return [
                "success" => true,
                "message" => "Payout processed successfully",
                "payout" => $totalPot,
            ];
        } catch (\Exception $e) {
            Log::error("[GameStakeService] Error processing game payout", [
                "game_id" => $game->id,
                "match_id" => $game->match_id ?? null,
                "winner_id" => $winnerId,
                "error" => $e->getMessage(),
            ]);

            return [
                "success" => false,
                "message" => $e->getMessage(),
                "payout" => 0,
            ];
        }
    }

    /**
     * Check if user has sufficient balance for match
     *
     * @param User $user
     * @return bool
     */
    public function canAffordMatch(User $user): bool
    {
        return $user->coins_balance >= self::MATCH_STAKE;
    }

    /**
     * Check if user has sufficient balance for game
     *
     * @param User $user
     * @return bool
     */
    public function canAffordGame(User $user): bool
    {
        return $user->coins_balance >= self::GAME_STAKE;
    }

    /**
     * Get stake amount for match
     *
     * @return int
     */
    public function getMatchStake(): int
    {
        return self::MATCH_STAKE;
    }

    /**
     * Get stake amount for game
     *
     * @return int
     */
    public function getGameStake(): int
    {
        return self::GAME_STAKE;
    }
}
