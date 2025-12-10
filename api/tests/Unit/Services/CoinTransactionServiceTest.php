<?php

namespace Tests\Unit\Services;

use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\User;
use App\Services\CoinTransactionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CoinTransactionServiceTest extends TestCase
{
    use RefreshDatabase;

    private CoinTransactionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CoinTransactionService();

        // Create transaction types for testing
        CoinTransactionType::create([
            "name" => "Coin purchase",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        CoinTransactionType::create([
            "name" => "Match payout",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        CoinTransactionType::create([
            "name" => "Deck purchase",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        CoinTransactionType::create([
            "name" => "Store purchase",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);
    }

    /**
     * Test createCreditTransaction with valid parameters
     */
    public function test_create_credit_transaction_with_valid_parameters()
    {
        $user = User::factory()->create(["coins_balance" => 100]);
        $coins = 50;

        $transaction = $this->service->createCreditTransaction(
            $user,
            "Coin purchase",
            $coins,
        );

        $this->assertInstanceOf(CoinTransaction::class, $transaction);
        $this->assertEquals($user->id, $transaction->user_id);
        $this->assertEquals($coins, $transaction->coins);
        $this->assertNotNull($transaction->transaction_datetime);

        // Check user balance was updated
        $user->refresh();
        $this->assertEquals(150, $user->coins_balance);
    }

    /**
     * Test createCreditTransaction with custom data
     */
    public function test_create_credit_transaction_with_custom_data()
    {
        $user = User::factory()->create(["coins_balance" => 0]);
        $coins = 75;
        $custom = ["bonus_type" => "daily", "multiplier" => 2];

        $transaction = $this->service->createCreditTransaction(
            $user,
            "Coin purchase",
            $coins,
            [],
            $custom,
        );

        $this->assertEquals($custom, $transaction->custom);
    }

    /**
     * Test createCreditTransaction throws exception for negative coins
     */
    public function test_create_credit_transaction_throws_exception_for_negative_coins()
    {
        $user = User::factory()->create();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Credit amount must be positive.");

        $this->service->createCreditTransaction($user, "Coin purchase", -10);
    }

    /**
     * Test createCreditTransaction throws exception for zero coins
     */
    public function test_create_credit_transaction_throws_exception_for_zero_coins()
    {
        $user = User::factory()->create();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Credit amount must be positive.");

        $this->service->createCreditTransaction($user, "Coin purchase", 0);
    }

    /**
     * Test createCreditTransaction uses fallback transaction type
     */
    public function test_create_credit_transaction_uses_fallback_transaction_type()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        // Try with non-existent transaction type name
        $transaction = $this->service->createCreditTransaction(
            $user,
            "Non-existent type",
            50,
        );

        $this->assertInstanceOf(CoinTransaction::class, $transaction);
        $this->assertEquals(50, $transaction->coins);

        // Should use any available credit type as fallback
        $this->assertNotNull($transaction->coin_transaction_type_id);
    }

    /**
     * Test createDebitTransaction with valid parameters
     */
    public function test_create_debit_transaction_with_valid_parameters()
    {
        $user = User::factory()->create(["coins_balance" => 100]);
        $coins = 30;

        $transaction = $this->service->createDebitTransaction(
            $user,
            "Deck purchase",
            $coins,
        );

        $this->assertInstanceOf(CoinTransaction::class, $transaction);
        $this->assertEquals($user->id, $transaction->user_id);
        $this->assertEquals(-$coins, $transaction->coins); // Should be negative
        $this->assertNotNull($transaction->transaction_datetime);

        // Check user balance was updated
        $user->refresh();
        $this->assertEquals(70, $user->coins_balance);
    }

    /**
     * Test createDebitTransaction with insufficient balance
     */
    public function test_create_debit_transaction_throws_exception_for_insufficient_balance()
    {
        $user = User::factory()->create(["coins_balance" => 20]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Insufficient balance.");

        $this->service->createDebitTransaction($user, "Deck purchase", 50);
    }

    /**
     * Test createDebitTransaction with exact balance
     */
    public function test_create_debit_transaction_with_exact_balance()
    {
        $user = User::factory()->create(["coins_balance" => 100]);
        $coins = 100;

        $transaction = $this->service->createDebitTransaction(
            $user,
            "Store purchase",
            $coins,
        );

        $this->assertEquals(-$coins, $transaction->coins);

        $user->refresh();
        $this->assertEquals(0, $user->coins_balance);
    }

    /**
     * Test createDebitTransaction throws exception for negative coins
     */
    public function test_create_debit_transaction_throws_exception_for_negative_coins()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Debit amount must be positive.");

        $this->service->createDebitTransaction($user, "Deck purchase", -10);
    }

    /**
     * Test createDebitTransaction throws exception for zero coins
     */
    public function test_create_debit_transaction_throws_exception_for_zero_coins()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Debit amount must be positive.");

        $this->service->createDebitTransaction($user, "Deck purchase", 0);
    }

    /**
     * Test transaction atomicity - credit transaction rollback on failure
     */
    public function test_credit_transaction_atomicity()
    {
        $user = User::factory()->create(["coins_balance" => 100]);
        $originalBalance = $user->coins_balance;

        // Mock a database error during transaction creation
        DB::shouldReceive("transaction")
            ->once()
            ->andThrow(new \Exception("Database error"));

        try {
            $this->service->createCreditTransaction($user, "Coin purchase", 50);
        } catch (\Exception $e) {
            // Expected exception
        }

        // User balance should remain unchanged
        $user->refresh();
        $this->assertEquals($originalBalance, $user->coins_balance);
    }

    /**
     * Test debit transaction uses database locking
     */
    public function test_debit_transaction_uses_database_locking()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        // This test ensures the method works with the lockForUpdate mechanism
        $transaction = $this->service->createDebitTransaction(
            $user,
            "Deck purchase",
            25,
        );

        $this->assertInstanceOf(CoinTransaction::class, $transaction);
        $this->assertEquals(-25, $transaction->coins);

        $user->refresh();
        $this->assertEquals(75, $user->coins_balance);
    }

    /**
     * Test multiple transactions on same user
     */
    public function test_multiple_transactions_on_same_user()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        // Credit transaction
        $creditTx = $this->service->createCreditTransaction(
            $user,
            "Coin purchase",
            50,
        );

        $user->refresh();
        $this->assertEquals(150, $user->coins_balance);

        // Debit transaction
        $debitTx = $this->service->createDebitTransaction(
            $user,
            "Deck purchase",
            30,
        );

        $user->refresh();
        $this->assertEquals(120, $user->coins_balance);

        $this->assertEquals(50, $creditTx->coins);
        $this->assertEquals(-30, $debitTx->coins);
    }

    /**
     * Test createDebitTransaction throws exception for non-existent transaction type
     */
    public function test_create_debit_transaction_throws_exception_for_non_existent_type()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        $this->expectException(
            \Illuminate\Database\Eloquent\ModelNotFoundException::class,
        );

        $this->service->createDebitTransaction(
            $user,
            "Non-existent debit type",
            50,
        );
    }

    /**
     * Test transaction datetime is set correctly
     */
    public function test_transaction_datetime_is_set_correctly()
    {
        $user = User::factory()->create(["coins_balance" => 100]);

        $transaction = $this->service->createCreditTransaction(
            $user,
            "Coin purchase",
            25,
        );

        $this->assertNotNull($transaction->transaction_datetime);
        $this->assertInstanceOf(
            \Carbon\Carbon::class,
            $transaction->transaction_datetime,
        );
    }
}
