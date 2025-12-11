<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Matches;

use App\Models\CoinTransactionType;
use App\Models\Deck;
use App\Services\CoinTransactionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class MatchEntryFeeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $player1;
    protected User $player2;
    protected User $admin;
    protected Deck $deck;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->player1 = User::factory()->create([
            "type" => "P",
            "coins_balance" => 100,
            "blocked" => false,
        ]);

        $this->player2 = User::factory()->create([
            "type" => "P",
            "coins_balance" => 100,
            "blocked" => false,
        ]);

        $this->admin = User::factory()->create([
            "type" => "A",
            "coins_balance" => 1000,
        ]);

        // Create a test deck
        $this->deck = Deck::create([
            "name" => "Test Deck",
            "slug" => "test-deck",
            "price" => 0,
            "active" => true,
        ]);

        // Create coin transaction types using insert
        \Illuminate\Support\Facades\DB::table(
            "coin_transaction_types",
        )->insertOrIgnore([
            [
                "id" => 1,
                "name" => "Match stake",
                "type" => "D",
            ],
            [
                "id" => 2,
                "name" => "Match payout",
                "type" => "C",
            ],
        ]);
    }

    public function test_match_creation_with_stake_debits_coins_from_both_players(): void
    {
        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                "id",
                "type",
                "player1_user_id",
                "player2_user_id",
                "stake",
                "status",
                "player1",
                "player2",
            ]);

        // Verify coins were debited from both players
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(90, $this->player1->coins_balance);
        $this->assertEquals(90, $this->player2->coins_balance);

        // Verify coin transactions were created
        $this->assertDatabaseCount("coin_transactions", 2);

        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player1->id,
            "coins" => -10,
        ]);

        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player2->id,
            "coins" => -10,
        ]);
    }

    public function test_match_creation_with_zero_stake_does_not_create_transactions(): void
    {
        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 0,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response->assertStatus(201);

        // Verify no coins were debited
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);

        // Verify no coin transactions were created
        $this->assertDatabaseCount("coin_transactions", 0);
    }

    public function test_match_creation_fails_when_player_has_insufficient_funds(): void
    {
        // Set player2 to have insufficient funds
        $this->player2->update(["coins_balance" => 5]);

        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response->assertStatus(422)->assertJsonValidationErrors(["stake"]);

        // Verify no match was created
        $this->assertDatabaseCount("matches", 0);

        // Verify no transactions occurred
        $this->assertDatabaseCount("coin_transactions", 0);
    }

    public function test_match_creation_fails_when_player_is_blocked(): void
    {
        // Block player2
        $this->player2->update(["blocked" => true]);

        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["player2_user_id"]);
    }

    public function test_match_finish_pays_winner_the_total_pot(): void
    {
        // Create match with stake
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Playing",
            "began_at" => now(),
        ]);

        // Simulate coins already debited (manually debit for test)
        $coinService = app(CoinTransactionService::class);
        $coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );
        $coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );

        Sanctum::actingAs($this->player1);

        $finishData = [
            "winner_user_id" => $this->player1->id,
            "player1_marks" => 2,
            "player2_marks" => 1,
        ];

        $response = $this->postJson(
            "/api/matches/{$match->id}/finish",
            $finishData,
        );

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                "message",
                "match" => [
                    "id",
                    "status",
                    "winner_user_id",
                    "loser_user_id",
                    "ended_at",
                ],
            ]);

        // Verify winner received payout
        $this->player1->refresh();
        $this->assertEquals(110, $this->player1->coins_balance); // 100 - 10 + 20 = 110

        // Verify match status updated
        $match->refresh();
        $this->assertEquals("Ended", $match->status);
        $this->assertEquals($this->player1->id, $match->winner_user_id);
        $this->assertEquals($this->player2->id, $match->loser_user_id);

        // Verify payout transaction was created
        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player1->id,
            "match_id" => $match->id,
            "coins" => 20, // Total pot (10 * 2)
        ]);
    }

    public function test_match_cancellation_refunds_both_players(): void
    {
        // Create match with stake (pending status)
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 15,
            "status" => "Pending",
        ]);

        // Simulate coins already debited
        $coinService = app(CoinTransactionService::class);
        $coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            15,
            ["match_id" => $match->id],
        );
        $coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            15,
            ["match_id" => $match->id],
        );

        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/matches/{$match->id}/cancel");

        $response
            ->assertStatus(200)
            ->assertJsonStructure(["message", "refunded_coins", "match"]);

        // Verify both players received refunds
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance); // Back to original
        $this->assertEquals(100, $this->player2->coins_balance); // Back to original

        // Verify match status updated to Interrupted
        $match->refresh();
        $this->assertEquals("Interrupted", $match->status);

        // Verify refund transactions were created
        $refundTransactions = \Illuminate\Support\Facades\DB::table(
            "coin_transactions",
        )
            ->where("match_id", $match->id)
            ->where("coins", ">", 0)
            ->count();

        $this->assertEquals(2, $refundTransactions); // Two refund transactions
    }

    public function test_cannot_cancel_non_pending_match(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Playing", // Not pending
        ]);

        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/matches/{$match->id}/cancel");

        $response->assertStatus(400)->assertJson([
            "message" =>
                "Only pending matches can be cancelled. Current status: Playing",
        ]);
    }

    public function test_can_get_match_transaction_history(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Pending",
        ]);

        // Create some transactions
        $coinService = app(CoinTransactionService::class);
        $coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );
        $coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );

        Sanctum::actingAs($this->player1);

        $response = $this->getJson("/api/matches/{$match->id}/transactions");

        $response->assertStatus(200)->assertJsonStructure([
            "match" => ["id", "stake", "status", "type"],
            "transactions" => [
                "*" => [
                    "id",
                    "transaction_datetime",
                    "user",
                    "coins",
                    "type",
                    "custom",
                ],
            ],
            "summary" => [
                "total_debits",
                "total_credits",
                "net_flow",
                "transaction_count",
            ],
        ]);

        $responseData = $response->json();
        $this->assertCount(2, $responseData["transactions"]);
        $this->assertEquals(20, $responseData["summary"]["total_debits"]);
        $this->assertEquals(0, $responseData["summary"]["total_credits"]);
    }

    public function test_unauthorized_user_cannot_access_match_transactions(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Pending",
        ]);

        $unauthorizedUser = User::factory()->create();
        Sanctum::actingAs($unauthorizedUser);

        $response = $this->getJson("/api/matches/{$match->id}/transactions");

        $response->assertStatus(403)->assertJson(["message" => "Unauthorized"]);
    }

    public function test_admin_can_access_any_match_transactions(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Pending",
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/matches/{$match->id}/transactions");

        $response->assertStatus(200);
    }

    public function test_match_creation_rollback_on_transaction_failure(): void
    {
        // Mock the CoinTransactionService to throw an exception
        $this->mock(CoinTransactionService::class, function ($mock) {
            $mock
                ->shouldReceive("createDebitTransaction")
                ->andThrow(new \Exception("Transaction failed"));
        });

        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response->assertStatus(500);

        // Verify no match was created due to rollback
        $this->assertDatabaseCount("matches", 0);

        // Verify original balances unchanged
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);
    }

    public function test_finish_match_with_zero_stake_does_not_create_payout(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 0,
            "status" => "Playing",
            "began_at" => now(),
        ]);

        Sanctum::actingAs($this->player1);

        $finishData = [
            "winner_user_id" => $this->player1->id,
            "player1_marks" => 2,
            "player2_marks" => 1,
        ];

        $response = $this->postJson(
            "/api/matches/{$match->id}/finish",
            $finishData,
        );

        $response->assertStatus(200);

        // Verify no payout transactions were created
        $payoutTransactions = \Illuminate\Support\Facades\DB::table(
            "coin_transactions",
        )
            ->where("match_id", $match->id)
            ->count();
        $this->assertEquals(0, $payoutTransactions);

        // Verify balances unchanged
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);
    }

    public function test_participant_can_manage_their_match(): void
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Pending",
        ]);

        // Player 2 should be able to cancel the match
        Sanctum::actingAs($this->player2);

        $response = $this->postJson("/api/matches/{$match->id}/cancel");

        $response->assertStatus(200);
    }

    public function test_match_with_same_player_ids_validation(): void
    {
        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player1->id, // Same as player1
            "stake" => 10,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["player2_user_id"]);
    }

    public function test_large_stake_transaction_handling(): void
    {
        // Set both players to have high balances
        $this->player1->update(["coins_balance" => 10000]);
        $this->player2->update(["coins_balance" => 10000]);

        Sanctum::actingAs($this->player1);

        $matchData = [
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 5000,
        ];

        $response = $this->postJson("/api/matches", $matchData);

        $response->assertStatus(201);

        // Verify large amounts handled correctly
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(5000, $this->player1->coins_balance);
        $this->assertEquals(5000, $this->player2->coins_balance);

        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player1->id,
            "coins" => -5000,
        ]);
    }
}
