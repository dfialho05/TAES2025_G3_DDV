<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\MatchController;
use App\Models\User;
use App\Models\Matches;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Services\CoinTransactionService;
use App\Http\Requests\StoreMatchRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tests\TestCase;
use Mockery;

class MatchControllerEntryFeeTest extends TestCase
{
    use RefreshDatabase;

    protected MatchController $controller;
    protected User $player1;
    protected User $player2;
    protected User $admin;
    protected CoinTransactionService $coinService;

    protected function setUp(): void
    {
        parent::setUp();

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

        // Ensure coin transaction types exist
        CoinTransactionType::firstOrCreate([
            "name" => "Match stake",
            "type" => "D",
        ]);

        CoinTransactionType::firstOrCreate([
            "name" => "Match payout",
            "type" => "C",
        ]);

        $this->coinService = app(CoinTransactionService::class);
        $this->controller = new MatchController($this->coinService);
    }

    public function test_store_creates_match_and_processes_entry_fees()
    {
        $request = Mockery::mock(StoreMatchRequest::class);
        $request->shouldReceive("validated")->andReturn([
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
            "status" => "Pending",
        ]);

        $response = $this->controller->store($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(201, $response->getStatusCode());

        // Verify match was created
        $this->assertDatabaseHas("matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
        ]);

        // Verify coins were debited
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(90, $this->player1->coins_balance);
        $this->assertEquals(90, $this->player2->coins_balance);

        // Verify transactions were created
        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player1->id,
            "coins" => -10,
        ]);

        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player2->id,
            "coins" => -10,
        ]);
    }

    public function test_store_with_zero_stake_does_not_process_fees()
    {
        $request = Mockery::mock(StoreMatchRequest::class);
        $request->shouldReceive("validated")->andReturn([
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 0,
            "status" => "Pending",
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(201, $response->getStatusCode());

        // Verify balances unchanged
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);

        // Verify no transactions created
        $this->assertDatabaseCount("coin_transactions", 0);
    }

    public function test_store_handles_coin_service_exception()
    {
        $mockCoinService = Mockery::mock(CoinTransactionService::class);
        $mockCoinService
            ->shouldReceive("createDebitTransaction")
            ->andThrow(new \Exception("Insufficient balance"));

        $controller = new MatchController($mockCoinService);

        $request = Mockery::mock(StoreMatchRequest::class);
        $request->shouldReceive("validated")->andReturn([
            "type" => "3",
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "stake" => 10,
            "status" => "Pending",
        ]);

        $response = $controller->store($request);

        $this->assertEquals(500, $response->getStatusCode());

        // Verify no match was created due to rollback
        $this->assertDatabaseCount("matches", 0);

        // Verify balances unchanged
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);
    }

    public function test_finish_match_pays_winner()
    {
        // Create match and simulate entry fees already paid
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 15,
            "status" => "Playing",
            "began_at" => now(),
        ]);

        // Simulate entry fees already debited
        $this->coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            15,
            ["match_id" => $match->id],
        );
        $this->coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            15,
            ["match_id" => $match->id],
        );

        $request = Request::create(
            "/matches/" . $match->id . "/finish",
            "POST",
            [
                "winner_user_id" => $this->player1->id,
                "player1_marks" => 2,
                "player2_marks" => 1,
            ],
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->finishMatch($request, $match->id);

        $this->assertEquals(200, $response->getStatusCode());

        // Verify winner received payout
        $this->player1->refresh();
        $this->assertEquals(115, $this->player1->coins_balance); // 100 - 15 + 30 = 115

        // Verify payout transaction
        $this->assertDatabaseHas("coin_transactions", [
            "user_id" => $this->player1->id,
            "match_id" => $match->id,
            "coins" => 30, // Total pot (15 * 2)
        ]);

        // Verify match status updated
        $match->refresh();
        $this->assertEquals("Ended", $match->status);
        $this->assertEquals($this->player1->id, $match->winner_user_id);
    }

    public function test_finish_match_with_zero_stake_does_not_pay()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 0,
            "status" => "Playing",
            "began_at" => now(),
        ]);

        $request = Request::create(
            "/matches/" . $match->id . "/finish",
            "POST",
            [
                "winner_user_id" => $this->player1->id,
                "player1_marks" => 2,
                "player2_marks" => 1,
            ],
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->finishMatch($request, $match->id);

        $this->assertEquals(200, $response->getStatusCode());

        // Verify no payout transactions
        $payoutTransactions = CoinTransaction::where(
            "match_id",
            $match->id,
        )->count();
        $this->assertEquals(0, $payoutTransactions);

        // Verify balances unchanged
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance);
        $this->assertEquals(100, $this->player2->coins_balance);
    }

    public function test_finish_match_unauthorized_user()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Playing",
        ]);

        $unauthorizedUser = User::factory()->create();
        $request = Request::create(
            "/matches/" . $match->id . "/finish",
            "POST",
            [
                "winner_user_id" => $this->player1->id,
            ],
        );
        $request->setUserResolver(fn() => $unauthorizedUser);

        $response = $this->controller->finishMatch($request, $match->id);

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString(
            "Unauthorized",
            $response->getContent(),
        );
    }

    public function test_cancel_match_refunds_players()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 20,
            "status" => "Pending",
        ]);

        // Simulate entry fees already debited
        $this->coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            20,
            ["match_id" => $match->id],
        );
        $this->coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            20,
            ["match_id" => $match->id],
        );

        $request = Request::create(
            "/matches/" . $match->id . "/cancel",
            "POST",
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->cancelMatch($request, $match->id);

        $this->assertEquals(200, $response->getStatusCode());

        // Verify refunds issued
        $this->player1->refresh();
        $this->player2->refresh();

        $this->assertEquals(100, $this->player1->coins_balance); // Back to original
        $this->assertEquals(100, $this->player2->coins_balance); // Back to original

        // Verify refund transactions
        $refundTransactions = CoinTransaction::where("match_id", $match->id)
            ->where("coins", ">", 0)
            ->count();

        $this->assertEquals(2, $refundTransactions);

        // Verify match status
        $match->refresh();
        $this->assertEquals("Interrupted", $match->status);
    }

    public function test_cancel_match_with_zero_stake()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 0,
            "status" => "Pending",
        ]);

        $request = Request::create(
            "/matches/" . $match->id . "/cancel",
            "POST",
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->cancelMatch($request, $match->id);

        $this->assertEquals(200, $response->getStatusCode());

        // Verify no transactions created (nothing to refund)
        $this->assertDatabaseCount("coin_transactions", 0);

        // Verify match status updated
        $match->refresh();
        $this->assertEquals("Interrupted", $match->status);
    }

    public function test_cancel_non_pending_match_fails()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Playing", // Not pending
        ]);

        $request = Request::create(
            "/matches/" . $match->id . "/cancel",
            "POST",
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->cancelMatch($request, $match->id);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertStringContainsString(
            "Only pending matches can be cancelled",
            $response->getContent(),
        );
    }

    public function test_get_match_transactions()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Pending",
        ]);

        // Create some transactions
        $this->coinService->createDebitTransaction(
            $this->player1,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );
        $this->coinService->createDebitTransaction(
            $this->player2,
            "Match stake",
            10,
            ["match_id" => $match->id],
        );

        $request = Request::create("/matches/" . $match->id . "/transactions");
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->getMatchTransactions(
            $request,
            $match->id,
        );

        $this->assertEquals(200, $response->getStatusCode());

        $responseData = json_decode($response->getContent(), true);

        $this->assertArrayHasKey("match", $responseData);
        $this->assertArrayHasKey("transactions", $responseData);
        $this->assertArrayHasKey("summary", $responseData);

        $this->assertCount(2, $responseData["transactions"]);
        $this->assertEquals(20, $responseData["summary"]["total_debits"]);
        $this->assertEquals(0, $responseData["summary"]["total_credits"]);
    }

    public function test_get_match_transactions_unauthorized()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Pending",
        ]);

        $unauthorizedUser = User::factory()->create();
        $request = Request::create("/matches/" . $match->id . "/transactions");
        $request->setUserResolver(fn() => $unauthorizedUser);

        $response = $this->controller->getMatchTransactions(
            $request,
            $match->id,
        );

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_any_match_transactions()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Pending",
        ]);

        $request = Request::create("/matches/" . $match->id . "/transactions");
        $request->setUserResolver(fn() => $this->admin);

        $response = $this->controller->getMatchTransactions(
            $request,
            $match->id,
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_finish_match_validates_winner_is_participant()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Playing",
        ]);

        $nonParticipant = User::factory()->create();

        $request = Request::create(
            "/matches/" . $match->id . "/finish",
            "POST",
            [
                "winner_user_id" => $nonParticipant->id, // Not a participant
            ],
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->finishMatch($request, $match->id);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertStringContainsString(
            "Winner must be one of the match players",
            $response->getContent(),
        );
    }

    public function test_finish_match_wrong_status()
    {
        $match = Matches::create([
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "stake" => 10,
            "status" => "Pending", // Wrong status
        ]);

        $request = Request::create(
            "/matches/" . $match->id . "/finish",
            "POST",
            [
                "winner_user_id" => $this->player1->id,
            ],
        );
        $request->setUserResolver(fn() => $this->player1);

        $response = $this->controller->finishMatch($request, $match->id);

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertStringContainsString(
            "cannot be finished",
            $response->getContent(),
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
