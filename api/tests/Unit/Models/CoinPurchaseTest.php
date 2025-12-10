<?php

namespace Tests\Unit\Models;

use App\Models\CoinPurchase;
use App\Models\User;
use App\Models\CoinTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class CoinPurchaseTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test CoinPurchase can be created
     */
    public function test_coin_purchase_can_be_created()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1, // Will create type if needed
            "coins" => 100,
        ]);

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 10.5,
            "payment_type" => CoinPurchase::PAYMENT_MBWAY,
            "payment_reference" => "911234567",
            "status" => "Completed",
        ]);

        $this->assertInstanceOf(CoinPurchase::class, $purchase);
        $this->assertEquals($user->id, $purchase->user_id);
        $this->assertEquals(
            $coinTransaction->id,
            $purchase->coin_transaction_id,
        );
        $this->assertEquals(10.5, $purchase->euros);
        $this->assertEquals(
            CoinPurchase::PAYMENT_MBWAY,
            $purchase->payment_type,
        );
        $this->assertEquals("911234567", $purchase->payment_reference);
    }

    /**
     * Test payment types constant
     */
    public function test_payment_types_constant()
    {
        $expectedTypes = [
            CoinPurchase::PAYMENT_MBWAY,
            CoinPurchase::PAYMENT_IBAN,
            CoinPurchase::PAYMENT_MB,
            CoinPurchase::PAYMENT_VISA,
            CoinPurchase::PAYMENT_PAYPAL,
        ];

        $this->assertEquals($expectedTypes, CoinPurchase::paymentTypes());
    }

    /**
     * Test individual payment type constants
     */
    public function test_payment_type_constants()
    {
        $this->assertEquals("MBWAY", CoinPurchase::PAYMENT_MBWAY);
        $this->assertEquals("IBAN", CoinPurchase::PAYMENT_IBAN);
        $this->assertEquals("MB", CoinPurchase::PAYMENT_MB);
        $this->assertEquals("VISA", CoinPurchase::PAYMENT_VISA);
        $this->assertEquals("PAYPAL", CoinPurchase::PAYMENT_PAYPAL);
    }

    /**
     * Test paymentTypes method returns array
     */
    public function test_payment_types_returns_array()
    {
        $types = CoinPurchase::paymentTypes();

        $this->assertIsArray($types);
        $this->assertCount(5, $types);
        $this->assertContains("MBWAY", $types);
        $this->assertContains("IBAN", $types);
        $this->assertContains("MB", $types);
        $this->assertContains("VISA", $types);
        $this->assertContains("PAYPAL", $types);
    }

    /**
     * Test purchase_datetime is cast to datetime
     */
    public function test_purchase_datetime_is_cast_to_datetime()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);
        $datetime = Carbon::now();

        $purchase = CoinPurchase::create([
            "purchase_datetime" => $datetime,
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 5.0,
            "payment_type" => CoinPurchase::PAYMENT_PAYPAL,
            "payment_reference" => "test@example.com",
            "status" => "Completed",
        ]);

        $this->assertInstanceOf(Carbon::class, $purchase->purchase_datetime);
        $this->assertEquals(
            $datetime->format("Y-m-d H:i:s"),
            $purchase->purchase_datetime->format("Y-m-d H:i:s"),
        );
    }

    /**
     * Test euros is cast to decimal
     */
    public function test_euros_is_cast_to_decimal()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 15,
            "payment_type" => CoinPurchase::PAYMENT_VISA,
            "payment_reference" => "4111111111111111",
            "status" => "Completed",
        ]);

        $this->assertEquals("15.00", $purchase->euros);
    }

    /**
     * Test custom field is cast to array
     */
    public function test_custom_field_is_cast_to_array()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);
        $customData = ["transaction_id" => "TXN123", "gateway" => "stripe"];

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 20.0,
            "payment_type" => CoinPurchase::PAYMENT_IBAN,
            "payment_reference" => "PT50000000000000000000025",
            "status" => "Completed",
            "custom" => $customData,
        ]);

        $this->assertIsArray($purchase->custom);
        $this->assertEquals($customData, $purchase->custom);
    }

    /**
     * Test timestamps are disabled
     */
    public function test_timestamps_are_disabled()
    {
        $purchase = new CoinPurchase();
        $this->assertFalse($purchase->timestamps);
    }

    /**
     * Test fillable attributes
     */
    public function test_fillable_attributes()
    {
        $fillable = [
            "purchase_datetime",
            "user_id",
            "coin_transaction_id",
            "euros",
            "payment_type",
            "payment_reference",
            "custom",
        ];

        $purchase = new CoinPurchase();
        $this->assertEquals($fillable, $purchase->getFillable());
    }

    /**
     * Test user relationship
     */
    public function test_user_relationship()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 25.0,
            "payment_type" => CoinPurchase::PAYMENT_MB,
            "payment_reference" => "12345-123456789",
            "status" => "Completed",
        ]);

        $this->assertInstanceOf(User::class, $purchase->user);
        $this->assertEquals($user->id, $purchase->user->id);
        $this->assertEquals($user->name, $purchase->user->name);
    }

    /**
     * Test coin transaction relationship
     */
    public function test_coin_transaction_relationship()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 30.0,
            "payment_type" => CoinPurchase::PAYMENT_MBWAY,
            "payment_reference" => "911234567",
            "status" => "Completed",
        ]);

        $this->assertInstanceOf(
            CoinTransaction::class,
            $purchase->coinTransaction,
        );
        $this->assertEquals(
            $coinTransaction->id,
            $purchase->coinTransaction->id,
        );
    }

    /**
     * Test purchase with null custom field
     */
    public function test_purchase_with_null_custom_field()
    {
        $user = User::factory()->create();
        $coinTransaction = CoinTransaction::create([
            "transaction_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_type_id" => 1,
            "coins" => 100,
        ]);

        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => $coinTransaction->id,
            "euros" => 5.0,
            "payment_type" => CoinPurchase::PAYMENT_PAYPAL,
            "payment_reference" => "user@example.com",
            "status" => "Completed",
            "custom" => null,
        ]);

        $this->assertNull($purchase->custom);
    }

    /**
     * Test purchase with different payment types
     */
    public function test_purchase_with_different_payment_types()
    {
        $user = User::factory()->create();

        $paymentTests = [
            [CoinPurchase::PAYMENT_MBWAY, "911234567"],
            [CoinPurchase::PAYMENT_PAYPAL, "test@example.com"],
            [CoinPurchase::PAYMENT_IBAN, "PT50000000000000000000025"],
            [CoinPurchase::PAYMENT_MB, "12345-123456789"],
            [CoinPurchase::PAYMENT_VISA, "4111111111111111"],
        ];

        foreach ($paymentTests as [$type, $reference]) {
            // Create a unique coin transaction for each purchase
            $coinTransaction = CoinTransaction::create([
                "transaction_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "coin_transaction_type_id" => 1,
                "coins" => 100,
            ]);

            $purchase = CoinPurchase::create([
                "purchase_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "coin_transaction_id" => $coinTransaction->id,
                "euros" => 10.0,
                "payment_type" => $type,
                "payment_reference" => $reference,
                "status" => "Completed",
            ]);

            $this->assertEquals($type, $purchase->payment_type);
            $this->assertEquals($reference, $purchase->payment_reference);
        }
    }

    /**
     * Test purchase with different euro amounts
     */
    public function test_purchase_with_different_euro_amounts()
    {
        $user = User::factory()->create();

        $amounts = [1.0, 5.5, 10.99, 25.0, 50.75, 100.0];

        foreach ($amounts as $amount) {
            // Create a unique coin transaction for each purchase
            $coinTransaction = CoinTransaction::create([
                "transaction_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "coin_transaction_type_id" => 1,
                "coins" => 100,
            ]);

            $purchase = CoinPurchase::create([
                "purchase_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "coin_transaction_id" => $coinTransaction->id,
                "euros" => $amount,
                "payment_type" => CoinPurchase::PAYMENT_MBWAY,
                "payment_reference" => "911234567",
                "status" => "Completed",
            ]);

            $this->assertEquals(number_format($amount, 2), $purchase->euros);
        }
    }
}
