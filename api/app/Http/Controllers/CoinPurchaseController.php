<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\User;
use App\Services\CoinTransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CoinPurchaseController extends Controller
{
    protected CoinTransactionService $transactionService;

    public function __construct(CoinTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function initiate(Request $request)
    {
        $user = $request->user();

        // 1. Validação
        $data = $request->validate([
            "euros" => ["required", "numeric", "min:0.01"],
            "payment_type" => [
                "required",
                Rule::in(CoinPurchase::paymentTypes()),
            ],
            "payment_reference" => ["required", "string", "max:100"],
        ]);

        $err = $this->validatePaymentReference(
            $data["payment_type"],
            $data["payment_reference"],
        );
        if ($err) {
            return response()->json(["message" => $err], 422);
        }

        $value = (int) $data["euros"];
        if ($data["euros"] != $value || $value < 1) {
            return response()->json(
                ["message" => "Valor deve ser um inteiro positivo."],
                422,
            );
        }

        // 2. Gateway
        $payload = [
            "type" => $data["payment_type"],
            "reference" => $data["payment_reference"],
            "value" => $value,
        ];

        $paymentsUrl = env("PAYMENTS_API_URL");
        if (!$paymentsUrl) {
            return response()->json(
                ["message" => "Provider não configurado."],
                500,
            );
        }

        // Payment Gateway Logic
        Log::info("Sending payment request", [
            "url" => $paymentsUrl,
            "payload" => $payload,
            "user_id" => $user->id,
        ]);

        try {
            $response = Http::timeout(10)->post($paymentsUrl, $payload);

            $statusCode = $response->status();
            $responseBody = $response->body();
            $providerResponse = $response->json();

            Log::info("Payment gateway response received", [
                "status_code" => $statusCode,
                "response_body" => $responseBody,
                "parsed_response" => $providerResponse,
                "user_id" => $user->id,
                "payload_sent" => $payload,
            ]);

            // Verificação Unificada:
            // 1. Se o request falhou (4xx, 5xx) OU
            // 2. Se o status no JSON não é 'valid'
            if (
                $response->failed() ||
                ($providerResponse["status"] ?? "") !== "valid"
            ) {
                Log::warning("Payment Rejected", [
                    "status_code" => $statusCode,
                    "response" => $providerResponse,
                    "payload" => $payload,
                    "user_id" => $user->id,
                ]);

                return response()->json(
                    [
                        "message" => "Saldo ou Método de pagamento inválido",
                        "debug_info" => [
                            "gateway_status" => $statusCode,
                            "gateway_response" => $providerResponse,
                            "payload_sent" => $payload,
                        ],
                    ],
                    422,
                );
            }
        } catch (\Exception $e) {
            // Se houver erro de conexão (Timeout, DNS), apanhamos aqui
            Log::error("Payment connection error", [
                "error" => $e->getMessage(),
                "payload" => $payload,
                "user_id" => $user->id,
                "url" => $paymentsUrl,
            ]);

            return response()->json(
                [
                    "message" => "Erro de conexão com gateway de pagamento",
                    "debug_info" => [
                        "error" => $e->getMessage(),
                        "payload_sent" => $payload,
                    ],
                ],
                422,
            );
        }

        // 3. Sucesso - Gravação na BD
        try {
            $result = DB::transaction(function () use ($user, $data, $value) {
                $coins = (int) round($value * 10);

                // Criar transação de crédito
                $tx = $this->transactionService->createCreditTransaction(
                    $user,
                    "Coin purchase",
                    $coins,
                    [],
                    [],
                );

                // Criar CoinPurchase
                $purchase = CoinPurchase::create([
                    "purchase_datetime" => Carbon::now(),
                    "user_id" => $user->id,
                    "coin_transaction_id" => $tx->id,
                    "euros" => $value,
                    "payment_type" => $data["payment_type"],
                    "payment_reference" => $data["payment_reference"],
                    "status" => "Completed",
                    "custom" => null,
                ]);

                return ["purchase" => $purchase, "transaction" => $tx];
            });

            return response()->json(
                [
                    "message" => "Pagamento bem sucedido",
                    "coins_credited" => $result["transaction"]->coins,
                    "new_balance" => $user->fresh()->coins_balance,
                    "purchase_id" => $result["purchase"]->id,
                ],
                201,
            );
        } catch (\Exception $e) {
            Log::error("Database error: " . $e->getMessage());
            return response()->json(
                ["message" => "Erro ao processar pagamento."],
                500,
            );
        }
    }

    private function validatePaymentReference(
        string $type,
        string $ref,
    ): ?string {
        switch ($type) {
            case CoinPurchase::PAYMENT_MBWAY:
                return preg_match('/^9\d{8}$/', $ref)
                    ? null
                    : "MBWAY inválido.";
            case CoinPurchase::PAYMENT_PAYPAL:
                return filter_var($ref, FILTER_VALIDATE_EMAIL)
                    ? null
                    : "Email inválido.";
            case CoinPurchase::PAYMENT_IBAN:
                return preg_match('/^[A-Z]{2}\d{23}$/', $ref)
                    ? null
                    : "IBAN inválido.";
            case CoinPurchase::PAYMENT_MB:
                return preg_match('/^\d{5}-\d{9}$/', $ref)
                    ? null
                    : "MB inválido.";
            case CoinPurchase::PAYMENT_VISA:
                return preg_match('/^4\d{15}$/', $ref)
                    ? null
                    : "VISA inválido.";
        }
        return null;
    }
}
