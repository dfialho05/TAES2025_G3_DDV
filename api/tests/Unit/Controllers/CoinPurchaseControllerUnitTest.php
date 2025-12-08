<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\CoinPurchaseController;
use App\Models\CoinPurchase;
use Tests\TestCase;
use ReflectionClass;
use ReflectionMethod;

class CoinPurchaseControllerUnitTest extends TestCase
{
    private CoinPurchaseController $controller;
    private ReflectionClass $reflection;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new CoinPurchaseController(
            app(\App\Services\CoinTransactionService::class),
        );
        $this->reflection = new ReflectionClass($this->controller);
    }

    /**
     * Get private method for testing
     */
    private function getPrivateMethod(string $methodName): ReflectionMethod
    {
        $method = $this->reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method;
    }

    /**
     * Test validatePaymentReference method with valid MBWAY
     */
    public function test_validate_payment_reference_valid_mbway()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $validMbwayNumbers = [
            "911234567",
            "922345678",
            "933456789",
            "964567890",
            "915678901",
        ];

        foreach ($validMbwayNumbers as $number) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_MBWAY,
                $number,
            );
            $this->assertNull(
                $result,
                "MBWAY number {$number} should be valid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with invalid MBWAY
     */
    public function test_validate_payment_reference_invalid_mbway()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $invalidMbwayNumbers = [
            "811234567", // doesn't start with 9
            "9112345678", // too long
            "91123456", // too short
            "91123456a", // contains letter
            "9112-34567", // contains dash
            "911 234 567", // contains spaces
        ];

        foreach ($invalidMbwayNumbers as $number) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_MBWAY,
                $number,
            );
            $this->assertEquals(
                "MBWAY inválido.",
                $result,
                "MBWAY number {$number} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with valid PayPal
     */
    public function test_validate_payment_reference_valid_paypal()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $validEmails = [
            "user@example.com",
            "test.email@domain.org",
            "user123@test-domain.net",
            "valid+email@subdomain.example.com",
            "simple@domain.co",
        ];

        foreach ($validEmails as $email) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_PAYPAL,
                $email,
            );
            $this->assertNull($result, "PayPal email {$email} should be valid");
        }
    }

    /**
     * Test validatePaymentReference method with invalid PayPal
     */
    public function test_validate_payment_reference_invalid_paypal()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $invalidEmails = [
            "invalid-email",
            "user@",
            "@domain.com",
            "user..double@domain.com",
            "user@domain",
            "user name@domain.com", // space in username
        ];

        foreach ($invalidEmails as $email) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_PAYPAL,
                $email,
            );
            $this->assertEquals(
                "Email inválido.",
                $result,
                "PayPal email {$email} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with valid IBAN
     */
    public function test_validate_payment_reference_valid_iban()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $validIbans = [
            "PT50000000000000000000025",
            "ES91210004184502000513320",
            "FR14200410100505000130260",
            "DE89370400440532013000000",
            "IT60054281110100000012345",
        ];

        foreach ($validIbans as $iban) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_IBAN,
                $iban,
            );
            $this->assertNull($result, "IBAN {$iban} should be valid");
        }
    }

    /**
     * Test validatePaymentReference method with invalid IBAN
     */
    public function test_validate_payment_reference_invalid_iban()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $invalidIbans = [
            "PT5000000000000000000002", // too short
            "PT500000000000000000000255", // too long
            "pt50000000000000000000025", // lowercase
            "1250000000000000000000025", // starts with digit
            "PT5A000000000000000000025", // letter in check digits
        ];

        foreach ($invalidIbans as $iban) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_IBAN,
                $iban,
            );
            $this->assertEquals(
                "IBAN inválido.",
                $result,
                "IBAN {$iban} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with valid MB
     */
    public function test_validate_payment_reference_valid_mb()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $validMbReferences = [
            "12345-123456789",
            "54321-987654321",
            "11111-111111111",
            "99999-999999999",
            "00001-000000001",
        ];

        foreach ($validMbReferences as $reference) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_MB,
                $reference,
            );
            $this->assertNull(
                $result,
                "MB reference {$reference} should be valid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with invalid MB
     */
    public function test_validate_payment_reference_invalid_mb()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $invalidMbReferences = [
            "1234-123456789", // entity too short
            "123456-123456789", // entity too long
            "12345-12345678", // reference too short
            "12345-1234567890", // reference too long
            "12345_123456789", // wrong separator
            "12345 123456789", // space separator
            "abcde-123456789", // letters in entity
        ];

        foreach ($invalidMbReferences as $reference) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_MB,
                $reference,
            );
            $this->assertEquals(
                "MB inválido.",
                $result,
                "MB reference {$reference} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with valid VISA
     */
    public function test_validate_payment_reference_valid_visa()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $validVisaNumbers = [
            "4111111111111111",
            "4012888888881881",
            "4000000000000002",
            "4999999999999995",
            "4444444444444448",
        ];

        foreach ($validVisaNumbers as $number) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_VISA,
                $number,
            );
            $this->assertNull($result, "VISA number {$number} should be valid");
        }
    }

    /**
     * Test validatePaymentReference method with invalid VISA
     */
    public function test_validate_payment_reference_invalid_visa()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $invalidVisaNumbers = [
            "5111111111111111", // starts with 5 (Mastercard)
            "3411111111111111", // starts with 3 (Amex)
            "411111111111111", // too short
            "41111111111111111", // too long
            "411111111111111a", // contains letter
            "4111-1111-1111-1111", // contains dashes
        ];

        foreach ($invalidVisaNumbers as $number) {
            $result = $method->invoke(
                $this->controller,
                CoinPurchase::PAYMENT_VISA,
                $number,
            );
            $this->assertEquals(
                "VISA inválido.",
                $result,
                "VISA number {$number} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with unknown payment type
     */
    public function test_validate_payment_reference_unknown_type()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $result = $method->invoke(
            $this->controller,
            "UNKNOWN_TYPE",
            "123456789",
        );
        $this->assertNull($result, "Unknown payment type should return null");
    }

    /**
     * Test validatePaymentReference method with empty reference
     */
    public function test_validate_payment_reference_empty_reference()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $testCases = [
            [CoinPurchase::PAYMENT_MBWAY, "", "MBWAY inválido."],
            [CoinPurchase::PAYMENT_PAYPAL, "", "Email inválido."],
            [CoinPurchase::PAYMENT_IBAN, "", "IBAN inválido."],
            [CoinPurchase::PAYMENT_MB, "", "MB inválido."],
            [CoinPurchase::PAYMENT_VISA, "", "VISA inválido."],
        ];

        foreach ($testCases as [$type, $reference, $expectedError]) {
            $result = $method->invoke($this->controller, $type, $reference);
            $this->assertEquals(
                $expectedError,
                $result,
                "Empty reference for {$type} should return error",
            );
        }
    }

    /**
     * Test validatePaymentReference method with whitespace references
     */
    public function test_validate_payment_reference_whitespace()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        $testCases = [
            [CoinPurchase::PAYMENT_MBWAY, " 911234567 ", "MBWAY inválido."],
            [
                CoinPurchase::PAYMENT_IBAN,
                " PT50000000000000000000025 ",
                "IBAN inválido.",
            ],
            [CoinPurchase::PAYMENT_MB, " 12345-123456789 ", "MB inválido."],
            [
                CoinPurchase::PAYMENT_VISA,
                " 4111111111111111 ",
                "VISA inválido.",
            ],
        ];

        foreach ($testCases as [$type, $reference, $expectedError]) {
            $result = $method->invoke($this->controller, $type, $reference);
            $this->assertEquals(
                $expectedError,
                $result,
                "Reference with whitespace for {$type} should be invalid",
            );
        }
    }

    /**
     * Test validatePaymentReference method with special characters
     */
    public function test_validate_payment_reference_special_characters()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        // Special characters should be invalid for most payment types except email
        $result = $method->invoke(
            $this->controller,
            CoinPurchase::PAYMENT_PAYPAL,
            "user+tag@example.com",
        );
        $this->assertNull($result, "PayPal should accept + in email");

        $result = $method->invoke(
            $this->controller,
            CoinPurchase::PAYMENT_PAYPAL,
            "user.name@example.com",
        );
        $this->assertNull($result, "PayPal should accept . in email");

        $result = $method->invoke(
            $this->controller,
            CoinPurchase::PAYMENT_MBWAY,
            "911-234-567",
        );
        $this->assertEquals(
            "MBWAY inválido.",
            $result,
            "MBWAY should not accept dashes",
        );
    }

    /**
     * Test validatePaymentReference method comprehensive coverage
     */
    public function test_validate_payment_reference_comprehensive()
    {
        $method = $this->getPrivateMethod("validatePaymentReference");

        // Test all valid combinations
        $validCombinations = [
            [CoinPurchase::PAYMENT_MBWAY, "911234567"],
            [CoinPurchase::PAYMENT_PAYPAL, "test@example.com"],
            [CoinPurchase::PAYMENT_IBAN, "PT50000000000000000000025"],
            [CoinPurchase::PAYMENT_MB, "12345-123456789"],
            [CoinPurchase::PAYMENT_VISA, "4111111111111111"],
        ];

        foreach ($validCombinations as [$type, $reference]) {
            $result = $method->invoke($this->controller, $type, $reference);
            $this->assertNull(
                $result,
                "Valid combination {$type} + {$reference} should pass",
            );
        }

        // Test all invalid combinations (wrong reference for payment type)
        $invalidCombinations = [
            [CoinPurchase::PAYMENT_MBWAY, "test@example.com"],
            [CoinPurchase::PAYMENT_PAYPAL, "911234567"],
            [CoinPurchase::PAYMENT_IBAN, "12345-123456789"],
            [CoinPurchase::PAYMENT_MB, "4111111111111111"],
            [CoinPurchase::PAYMENT_VISA, "PT50000000000000000000025"],
        ];

        foreach ($invalidCombinations as [$type, $reference]) {
            $result = $method->invoke($this->controller, $type, $reference);
            $this->assertNotNull(
                $result,
                "Invalid combination {$type} + {$reference} should fail",
            );
        }
    }
}
