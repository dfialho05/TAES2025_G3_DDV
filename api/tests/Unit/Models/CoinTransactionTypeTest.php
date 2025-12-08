<?php

namespace Tests\Unit\Models;

use App\Models\CoinTransactionType;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class CoinTransactionTypeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test CoinTransactionType can be created
     */
    public function test_coin_transaction_type_can_be_created()
    {
        $transactionType = CoinTransactionType::create([
            "name" => "Coin Purchase",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $this->assertInstanceOf(CoinTransactionType::class, $transactionType);
        $this->assertEquals("Coin Purchase", $transactionType->name);
        $this->assertEquals(
            CoinTransactionType::TYPE_CREDIT,
            $transactionType->type,
        );
    }

    /**
     * Test TYPE_CREDIT constant
     */
    public function test_type_credit_constant()
    {
        $this->assertEquals("C", CoinTransactionType::TYPE_CREDIT);
    }

    /**
     * Test TYPE_DEBIT constant
     */
    public function test_type_debit_constant()
    {
        $this->assertEquals("D", CoinTransactionType::TYPE_DEBIT);
    }

    /**
     * Test transaction type creation with credit type
     */
    public function test_transaction_type_creation_with_credit_type()
    {
        $creditType = CoinTransactionType::create([
            "name" => "Match Reward",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $this->assertEquals("C", $creditType->type);
    }

    /**
     * Test transaction type creation with debit type
     */
    public function test_transaction_type_creation_with_debit_type()
    {
        $debitType = CoinTransactionType::create([
            "name" => "Store Purchase",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $this->assertEquals("D", $debitType->type);
    }

    /**
     * Test fillable attributes
     */
    public function test_fillable_attributes()
    {
        $expectedFillable = ["name", "type", "custom"];

        $transactionType = new CoinTransactionType();
        $this->assertEquals($expectedFillable, $transactionType->getFillable());
    }

    /**
     * Test coin transactions relationship
     */
    public function test_coin_transactions_relationship()
    {
        $user = User::factory()->create();
        $transactionType = CoinTransactionType::create([
            "name" => "Test Relationship",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $transaction1 = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 100,
        ]);

        $transaction2 = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => $transactionType->id,
            "coins" => 50,
        ]);

        $relatedTransactions = $transactionType->coinTransactions;

        $this->assertCount(2, $relatedTransactions);
        $this->assertTrue($relatedTransactions->contains($transaction1));
        $this->assertTrue($relatedTransactions->contains($transaction2));
    }

    /**
     * Test transaction type can be deleted
     */
    public function test_transaction_type_can_be_deleted()
    {
        $transactionType = CoinTransactionType::create([
            "name" => "Temporary Type",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $typeId = $transactionType->id;

        $transactionType->delete();

        $this->assertNull(CoinTransactionType::find($typeId));
    }

    /**
     * Test query transaction types by type
     */
    public function test_query_transaction_types_by_type()
    {
        CoinTransactionType::create([
            "name" => "Credit Type 1",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        CoinTransactionType::create([
            "name" => "Credit Type 2",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        CoinTransactionType::create([
            "name" => "Debit Type 1",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        // Note: Since there are 6 default transaction types from migration, we expect those plus our 3
        $creditTypes = CoinTransactionType::where(
            "type",
            CoinTransactionType::TYPE_CREDIT,
        )->get();
        $debitTypes = CoinTransactionType::where(
            "type",
            CoinTransactionType::TYPE_DEBIT,
        )->get();

        $this->assertGreaterThanOrEqual(2, $creditTypes->count());
        $this->assertGreaterThanOrEqual(1, $debitTypes->count());
    }

    /**
     * Test transaction type name uniqueness constraints
     */
    public function test_transaction_type_names_can_be_duplicate_with_different_types()
    {
        $creditType = CoinTransactionType::create([
            "name" => "Purchase",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $debitType = CoinTransactionType::create([
            "name" => "Purchase",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $this->assertEquals("Purchase", $creditType->name);
        $this->assertEquals("Purchase", $debitType->name);
        $this->assertNotEquals($creditType->type, $debitType->type);
    }

    /**
     * Test transaction type with long name
     */
    public function test_transaction_type_with_long_name()
    {
        $longName = str_repeat("A very long transaction type name ", 5);

        $transactionType = CoinTransactionType::create([
            "name" => $longName,
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $this->assertEquals($longName, $transactionType->name);
    }

    /**
     * Test transaction type ordering by name
     */
    public function test_transaction_type_ordering_by_name()
    {
        $zebra = CoinTransactionType::create([
            "name" => "Zebra Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $alpha = CoinTransactionType::create([
            "name" => "Alpha Transaction",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $beta = CoinTransactionType::create([
            "name" => "Beta Transaction",
            "type" => CoinTransactionType::TYPE_DEBIT,
        ]);

        $typesByNameAsc = CoinTransactionType::orderBy("name", "asc")->get();
        $typesByNameDesc = CoinTransactionType::orderBy("name", "desc")->get();

        $this->assertEquals($alpha->id, $typesByNameAsc->first()->id);
        $this->assertEquals($zebra->id, $typesByNameAsc->last()->id);

        $this->assertEquals($zebra->id, $typesByNameDesc->first()->id);
        $this->assertEquals($alpha->id, $typesByNameDesc->last()->id);
    }

    /**
     * Test transaction type with special characters in name
     */
    public function test_transaction_type_with_special_characters()
    {
        $specialName = "Transaction & Co. - Premium Edition!";

        $transactionType = CoinTransactionType::create([
            "name" => $specialName,
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $this->assertEquals($specialName, $transactionType->name);
    }

    /**
     * Test transaction type string representation
     */
    public function test_transaction_type_string_representation()
    {
        $transactionType = CoinTransactionType::create([
            "name" => "Test Type",
            "type" => CoinTransactionType::TYPE_CREDIT,
        ]);

        $string = (string) $transactionType;

        $this->assertStringContainsString("Test Type", $string);
    }
}
