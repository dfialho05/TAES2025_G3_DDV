<?php

namespace Tests\Unit\Models;

use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\User;
use App\Models\Game;
use App\Models\Matches;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class CoinTransactionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test CoinTransaction can be created
     */
    public function test_coin_transaction_can_be_created()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Test Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
        ]);

        $this->assertInstanceOf(CoinTransaction::class, $transaction);
        $this->assertEquals($user->id, $transaction->user_id);
        $this->assertEquals(
            $transactionType->id,
            $transaction->coin_transaction_type_id,
        );
        $this->assertEquals(100, $transaction->coins);
    }

    /**
     * Test transaction_datetime is cast to datetime
     */
    public function test_transaction_datetime_is_cast_to_datetime()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Test Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);
        $datetime = Carbon::now();

        $transaction = CoinTransaction::create([
            "transaction_datetime" => $datetime,
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 50,
        ]);

        $this->assertInstanceOf(
            Carbon::class,
            $transaction->transaction_datetime,
        );
        $this->assertEquals(
            $datetime->format("Y-m-d H:i:s"),
            $transaction->transaction_datetime->format("Y-m-d H:i:s"),
        );
    }

    /**
     * Test coins field accepts positive values
     */
    public function test_coins_field_accepts_positive_values()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Credit Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 250,
        ]);

        $this->assertEquals(250, $transaction->coins);
        $this->assertGreaterThan(0, $transaction->coins);
    }

    /**
     * Test coins field accepts negative values
     */
    public function test_coins_field_accepts_negative_values()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Debit Transaction",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => -150,
        ]);

        $this->assertEquals(-150, $transaction->coins);
        $this->assertLessThan(0, $transaction->coins);
    }

    /**
     * Test coins field accepts zero value
     */
    public function test_coins_field_accepts_zero_value()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Zero Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 0,
        ]);

        $this->assertEquals(0, $transaction->coins);
    }

    /**
     * Test custom field is cast to array
     */
    public function test_custom_field_is_cast_to_array()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Custom Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);
        $customData = ["bonus_type" => "daily", "multiplier" => 2.0];

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
            "custom" => $customData,
        ]);

        $this->assertIsArray($transaction->custom);
        $this->assertEquals($customData, $transaction->custom);
    }

    /**
     * Test transaction with null custom field
     */
    public function test_transaction_with_null_custom_field()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Simple Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 50,
            "custom" => null,
        ]);

        $this->assertNull($transaction->custom);
    }

    /**
     * Test fillable attributes
     */
    public function test_fillable_attributes()
    {
        $expectedFillable = [
            "transaction_datetime",
            "user_id",
            "match_id",
            "game_id",
            "coin_transaction_type_id",
            "coins",
            "custom",
        ];

        $transaction = new CoinTransaction();
        $this->assertEquals($expectedFillable, $transaction->getFillable());
    }

    /**
     * Test timestamps are disabled
     */
    public function test_timestamps_are_disabled()
    {
        $transaction = new CoinTransaction();
        $this->assertFalse($transaction->timestamps);
    }

    /**
     * Test user relationship
     */
    public function test_user_relationship()
    {
        $user = User::factory()->create(["name" => "Transaction User"]);
        $transactionType = CoinTransactionType::create([
            "name" => "Test Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
        ]);

        $this->assertInstanceOf(User::class, $transaction->user);
        $this->assertEquals($user->id, $transaction->user->id);
        $this->assertEquals("Transaction User", $transaction->user->name);
    }

    /**
     * Test coin transaction type relationship
     */
    public function test_coin_transaction_type_relationship()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Purchase Coins",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
        ]);

        $this->assertInstanceOf(
            CoinTransactionType::class,
            $transaction->coinTransactionType,
        );
        $this->assertEquals(
            $transactionType->id,
            $transaction->coinTransactionType->id,
        );
        $this->assertEquals(
            "Purchase Coins",
            $transaction->coinTransactionType->name,
        );
    }

    /**
     * Test large coin amounts
     */
    public function test_large_coin_amounts()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Large Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $largeAmount = 999999;

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => $largeAmount,
        ]);

        $this->assertEquals($largeAmount, $transaction->coins);
    }

    /**
     * Test transaction ordering by datetime
     */
    public function test_transaction_ordering_by_datetime()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Ordered Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $oldTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now()->subDays(2),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 50,
        ]);

        $newTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
        ]);

        $transactionsByDate = CoinTransaction::orderBy(
            "transaction_datetime",
            "desc",
        )->get();

        $this->assertEquals(
            $newTransaction->id,
            $transactionsByDate->first()->id,
        );
        $this->assertEquals(
            $oldTransaction->id,
            $transactionsByDate->last()->id,
        );
    }

    /**
     * Test multiple transactions for same user
     */
    public function test_multiple_transactions_for_same_user()
    {
        $user = User::factory()->create();
        $creditType = CoinTransactionType::create([
            "name" => "Credit",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);
        $debitType = CoinTransactionType::create([
            "name" => "Debit",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $creditTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $creditType->id,
            "coins" => 100,
        ]);

        $debitTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $debitType->id,
            "coins" => -50,
        ]);

        $userTransactions = CoinTransaction::where("user_id", $user->id)->get();

        $this->assertCount(2, $userTransactions);
        $this->assertTrue($userTransactions->contains($creditTransaction));
        $this->assertTrue($userTransactions->contains($debitTransaction));
    }

    /**
     * Test transaction with complex custom data
     */
    public function test_transaction_with_complex_custom_data()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Complex Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $complexCustomData = [
            "source" => "achievement",
            "achievement_id" => 42,
            "metadata" => [
                "level" => 5,
                "category" => "daily_challenge",
                "bonus_applied" => true,
            ],
            "timestamp" => Carbon::now()->toISOString(),
        ];

        $transaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 150,
            "custom" => $complexCustomData,
        ]);

        $this->assertEquals($complexCustomData, $transaction->custom);
        $this->assertEquals("achievement", $transaction->custom["source"]);
        $this->assertEquals(42, $transaction->custom["achievement_id"]);
        $this->assertIsArray($transaction->custom["metadata"]);
    }
}
