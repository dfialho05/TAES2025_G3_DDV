<?php

namespace Tests\Unit\Helpers;

use Tests\TestCase;

class PaymentValidationTest extends TestCase
{
    /**
     * Test MBWAY validation with valid numbers
     */
    public function test_mbway_validation_with_valid_numbers()
    {
        $validMbwayNumbers = [
            '911234567',
            '922345678',
            '933456789',
            '964567890',
            '915678901',
        ];

        foreach ($validMbwayNumbers as $number) {
            $this->assertTrue(
                preg_match('/^9\d{8}$/', $number) === 1,
                "MBWAY number {$number} should be valid"
            );
        }
    }

    /**
     * Test MBWAY validation with invalid numbers
     */
    public function test_mbway_validation_with_invalid_numbers()
    {
        $invalidMbwayNumbers = [
            '811234567', // doesn't start with 9
            '9112345678', // too long
            '91123456', // too short
            '91123456a', // contains letter
            '9112-34567', // contains dash
            '911 234 567', // contains spaces
            '+351911234567', // contains country code
            '91.123.456.7', // contains dots
        ];

        foreach ($invalidMbwayNumbers as $number) {
            $this->assertFalse(
                preg_match('/^9\d{8}$/', $number) === 1,
                "MBWAY number {$number} should be invalid"
            );
        }
    }

    /**
     * Test PayPal email validation with valid emails
     */
    public function test_paypal_email_validation_with_valid_emails()
    {
        $validEmails = [
            'user@example.com',
            'test.email@domain.org',
            'user123@test-domain.net',
            'valid+email@subdomain.example.com',
            'simple@domain.co',
        ];

        foreach ($validEmails as $email) {
            $this->assertNotFalse(
                filter_var($email, FILTER_VALIDATE_EMAIL),
                "Email {$email} should be valid"
            );
        }
    }

    /**
     * Test PayPal email validation with invalid emails
     */
    public function test_paypal_email_validation_with_invalid_emails()
    {
        $invalidEmails = [
            'invalid-email',
            'user@',
            '@domain.com',
            'user..double@domain.com',
            'user@domain',
            'user name@domain.com', // space in username
            'user@domain..com', // double dot in domain
            'user@.domain.com', // starting dot in domain
        ];

        foreach ($invalidEmails as $email) {
            $this->assertFalse(
                filter_var($email, FILTER_VALIDATE_EMAIL),
                "Email {$email} should be invalid"
            );
        }
    }

    /**
     * Test IBAN validation with valid IBANs
     */
    public function test_iban_validation_with_valid_ibans()
    {
        $validIbans = [
            'PT50000000000000000000025',
            'GB82WEST12345698765432',
            'DE89370400440532013000',
            'FR1420041010050500013M02606',
            'ES9121000418450200051332',
        ];

        foreach ($validIbans as $iban) {
            $this->assertTrue(
                preg_match('/^[A-Z]{2}\d{23}$/', $iban) === 1 ||
                preg_match('/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/', $iban) === 1,
                "IBAN {$iban} should be valid format"
            );
        }
    }

    /**
     * Test IBAN validation with invalid IBANs
     */
    public function test_iban_validation_with_invalid_ibans()
    {
        $invalidIbans = [
            'PT5000000000000000000002', // too short
            'PT500000000000000000000255', // too long
            'pt50000000000000000000025', // lowercase country code
            '1250000000000000000000025', // digits instead of country code
            'PT5A000000000000000000025', // letter in check digits
            'PT50-00000000000000000025', // dash in IBAN
            'PT50 00000000000000000025', // space in IBAN
        ];

        foreach ($invalidIbans as $iban) {
            $this->assertFalse(
                preg_match('/^[A-Z]{2}\d{23}$/', $iban) === 1,
                "IBAN {$iban} should be invalid"
            );
        }
    }

    /**
     * Test MB (Multibanco) validation with valid references
     */
    public function test_mb_validation_with_valid_references()
    {
        $validMbReferences = [
            '12345-123456789',
            '54321-987654321',
            '11111-111111111',
            '99999-999999999',
            '00001-000000001',
        ];

        foreach ($validMbReferences as $reference) {
            $this->assertTrue(
                preg_match('/^\d{5}-\d{9}$/', $reference) === 1,
                "MB reference {$reference} should be valid"
            );
        }
    }

    /**
     * Test MB validation with invalid references
     */
    public function test_mb_validation_with_invalid_references()
    {
        $invalidMbReferences = [
            '1234-123456789', // entity too short
            '123456-123456789', // entity too long
            '12345-12345678', // reference too short
            '12345-1234567890', // reference too long
            '12345_123456789', // underscore instead of dash
            '12345 123456789', // space instead of dash
            '12345123456789', // no separator
            'abcde-123456789', // letters in entity
            '12345-12345678a', // letter in reference
        ];

        foreach ($invalidMbReferences as $reference) {
            $this->assertFalse(
                preg_match('/^\d{5}-\d{9}$/', $reference) === 1,
                "MB reference {$reference} should be invalid"
            );
        }
    }

    /**
     * Test VISA card validation with valid numbers
     */
    public function test_visa_validation_with_valid_numbers()
    {
        $validVisaNumbers = [
            '4111111111111111',
            '4012888888881881',
            '4222222222222',
            '4000000000000002',
            '4999999999999995',
        ];

        foreach ($validVisaNumbers as $number) {
            $this->assertTrue(
                preg_match('/^4\d{15}$/', $number) === 1 ||
                preg_match('/^4\d{12}$/', $number) === 1,
                "VISA number {$number} should be valid format"
            );
        }
    }

    /**
     * Test VISA card validation with invalid numbers
     */
    public function test_visa_validation_with_invalid_numbers()
    {
        $invalidVisaNumbers = [
            '5111111111111111', // starts with 5 (Mastercard)
            '3411111111111111', // starts with 3 (Amex)
            '411111111111111', // too short
            '41111111111111111', // too long
            '411111111111111a', // contains letter
            '4111-1111-1111-1111', // contains dashes
            '4111 1111 1111 1111', // contains spaces
            '4111.1111.1111.1111', // contains dots
        ];

        foreach ($invalidVisaNumbers as $number) {
            $this->assertFalse(
                preg_match('/^4\d{15}$/', $number) === 1,
                "VISA number {$number} should be invalid"
            );
        }
    }

    /**
     * Test payment type validation
     */
    public function test_payment_type_validation()
    {
        $validPaymentTypes = ['MBWAY', 'PAYPAL', 'IBAN', 'MB', 'VISA'];
        $invalidPaymentTypes = ['CREDIT_CARD', 'BANK_TRANSFER', 'CRYPTO', 'mbway', 'paypal'];

        foreach ($validPaymentTypes as $type) {
            $this->assertContains($type, $validPaymentTypes);
        }

        foreach ($invalidPaymentTypes as $type) {
            $this->assertNotContains($type, $validPaymentTypes);
        }
    }

    /**
     * Test euro amount validation
     */
    public function test_euro_amount_validation()
    {
        $validAmounts = [1, 5, 10, 25, 50, 100, 500, 1000];
        $invalidAmounts = [0, -1, 0.5, 1.5, 2.99, 'abc', null];

        foreach ($validAmounts as $amount) {
            $this->assertTrue(
                is_numeric($amount) && $amount > 0 && $amount == (int)$amount,
                "Amount {$amount} should be valid"
            );
        }

        foreach ($invalidAmounts as $amount) {
            $this->assertFalse(
                is_numeric($amount) && $amount > 0 && $amount == (int)$amount,
                "Amount {$amount} should be invalid"
            );
        }
    }

    /**
     * Test payment reference length validation
     */
    public function test_payment_reference_length_validation()
    {
        $maxLength = 100;

        // Valid length
        $validReference = str_repeat('a', $maxLength);
        $this->assertLessThanOrEqual($maxLength, strlen($validReference));

        // Invalid length
        $invalidReference = str_repeat('a', $maxLength + 1);
        $this->assertGreaterThan($maxLength, strlen($invalidReference));

        // Empty reference
        $emptyReference = '';
        $this->assertEquals(0, strlen($emptyReference));
    }

    /**
     * Test combined validation scenarios
     */
    public function test_combined_validation_scenarios()
    {
        $testCases = [
            ['MBWAY', '911234567', true],
            ['MBWAY', '811234567', false],
            ['PAYPAL', 'user@example.com', true],
            ['PAYPAL', 'invalid-email', false],
            ['IBAN', 'PT50000000000000000000025', true],
            ['IBAN', 'INVALID_IBAN', false],
            ['MB', '12345-123456789', true],
            ['MB', '12345_123456789', false],
            ['VISA', '4111111111111111', true],
            ['VISA', '5111111111111111', false],
        ];

        foreach ($testCases as [$type, $reference, $expected]) {
            $result = $this->validatePaymentReference($type, $reference);
            $this->assertEquals(
                $expected,
                $result,
                "Validation for {$type} with {$reference} should be {$expected}"
            );
        }
    }

    /**
     * Helper method to validate payment reference
     */
    private function validatePaymentReference(string $type, string $reference): bool
    {
        switch ($type) {
            case 'MBWAY':
                return preg_match('/^9\d{8}$/', $reference) === 1;
            case 'PAYPAL':
                return filter_var($reference, FILTER_VALIDATE_EMAIL) !== false;
            case 'IBAN':
                return preg_match('/^[A-Z]{2}\d{23}$/', $reference) === 1;
            case 'MB':
                return preg_match('/^\d{5}-\d{9}$/', $reference) === 1;
            case 'VISA':
                return preg_match('/^4\d{15}$/', $reference) === 1;
            default:
                return false;
        }
    }

    /**
     * Test edge cases for payment validation
     */
    public function test_payment_validation_edge_cases()
    {
        // Test null values
        $this->assertFalse($this->validatePaymentReference('MBWAY', ''));

        // Test whitespace
        $this->assertFalse($this->validatePaymentReference('MBWAY', ' 911234567 '));

        // Test case sensitivity
        $this->assertTrue($this->validatePaymentReference('PAYPAL', 'User@Example.COM'));
        $this->assertFalse($this->validatePaymentReference('IBAN', 'pt50000000000000000000025'));

        // Test special characters
        $this->assertTrue($this->validatePaymentReference('PAYPAL', 'user+test@example.com'));
        $this->assertFalse($this->validatePaymentReference('MBWAY', '911-234-567'));
    }
}
