<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class CoinPurchaseController extends Controller
{
    /**
     * Inicia uma compra: cria um CoinPurchase em estado Pending.
     * Autenticado (o user é o buyer).
     */
    /**
     * Inicia uma compra: cria um CoinPurchase em estado Pending e chama o gateway.
     * Autenticado (o user é o buyer).
     */
    public function initiate(Request $request)
    {
        $user = $request->user();

        // 1. Validação de Laravel (já existe no seu código)
        $data = $request->validate([
            "euros" => ["required", "numeric", "min:0.01"],
            "payment_type" => [
                "required",
                Rule::in(CoinPurchase::paymentTypes()),
            ],
            "payment_reference" => ["required", "string", "max:100"],
            "custom" => ["nullable", "array"],
        ]);

        // 2. Validação detalhada da payment_reference (já existe no seu código)
        $err = $this->validatePaymentReference(
            $data["payment_type"],
            $data["payment_reference"],
        );
        if ($err) {
            return response()->json(["message" => $err], 422);
        }

        // --- NOVO REQUISITO DE VALIDAÇÃO: "value" (euros) deve ser um inteiro entre 1 e 99 ---
        $value = (int) $data["euros"]; // Usamos (int) para o valor em euros
        if ($data["euros"] != $value || $value < 1 || $value > 99) {
            return response()->json(
                [
                    "message" =>
                        "Value must be a positive integer between 1 and 99.",
                ],
                422,
            );
        }
        // -----------------------------------------------------------------------------------

        // 3. Criação do CoinPurchase (já existe no seu código)
        $purchase = CoinPurchase::create([
            "purchase_datetime" => Carbon::now(),
            "user_id" => $user->id,
            "coin_transaction_id" => null,
            "euros" => $data["euros"],
            "payment_type" => $data["payment_type"],
            "payment_reference" => $data["payment_reference"],
            "custom" => $data["custom"] ?? null,
            "status" => "Pending",
        ]);

        // 4. CHAMADA AO GATEWAY DE PAGAMENTO EXTERNO (Implementação da API)
        $payload = [
            "type" => $data["payment_type"],
            "reference" => $data["payment_reference"],
            "value" => $value, // Usa o valor em euros como inteiro
        ];

        $response = Http::post(
            config("services.payments.url") . "/api/debit",
            $payload,
        );

        // 5. Tratamento da Resposta do Gateway
        if ($response->successful()) {
            // O Gateway aceitou o pedido com sucesso (Status 201 Created)
            // O webhook chamará o nosso endpoint mais tarde para confirmar ou falhar.
            return response()->json(
                [
                    "purchase" => $purchase,
                    "message" =>
                        "Purchase initiated and payment submitted to gateway. Awaiting external confirmation.",
                    // Você pode querer devolver o ID da compra externa se o gateway o fornecer.
                    "provider_response" => $response->json(),
                ],
                201,
            );
        } elseif ($response->status() === 422) {
            // O Gateway rejeitou o pedido por erros de validação (Bad Payload, etc.)
            Log::warning(
                "External Payment Gateway validation failed for purchase {$purchase->id}: " .
                    $response->body(),
            );

            // Marca a compra como falhada LOCALMENTE antes de responder ao utilizador
            $purchase->status = "Failed";
            $purchase->custom = array_merge((array) $purchase->custom, [
                "gateway_error" => $response->json(),
            ]);
            $purchase->save();

            return response()->json(
                [
                    "message" =>
                        "Payment submission failed due to external validation errors.",
                    "details" => $response->json(),
                ],
                422,
            );
        } else {
            // Outros erros HTTP (500 Internal Server Error, 404 Not Found, etc.)
            Log::error(
                "External Payment Gateway communication error for purchase {$purchase->id}: " .
                    $response->body(),
            );

            // Marca a compra como falhada LOCALMENTE
            $purchase->status = "Failed";
            $purchase->custom = array_merge((array) $purchase->custom, [
                "gateway_error" =>
                    "Communication/Server Error: " . $response->status(),
            ]);
            $purchase->save();

            return response()->json(
                [
                    "message" =>
                        "Failed to communicate with external payment gateway.",
                ],
                503,
            ); // Service Unavailable ou 500
        }
    }

    /**
     * Webhook que a API externa chama para confirmar/cancelar o pagamento.
     * Deve ser idempotente.
     *
     * Exemplo payload esperado:
     * {
     *   "purchase_id": 123,
     *   "status": "success" | "failed",
     *   "provider_data": { ... } // opcional
     * }
     */
    public function webhook(Request $request)
    {
        // verificar assinatura/secret: depende do provider.
        // Por exemplo, podes verificar um header 'X-PAY-SIGN' com um secret.
        // if (! $this->verifySignature($request)) { return response('', 401); }

        $data = $request->validate([
            "purchase_id" => ["required", "integer"],
            "status" => ["required", Rule::in(["success", "failed"])],
            "provider_data" => ["nullable", "array"],
        ]);

        /** @var CoinPurchase|null $purchase */
        $purchase = CoinPurchase::find($data["purchase_id"]);
        if (!$purchase) {
            Log::warning(
                "Webhook for unknown purchase_id: {$data["purchase_id"]}",
            );
            return response()->json(["message" => "Unknown purchase"], 404);
        }

        // Idempotência: se já Completed ou Failed, devolve OK sem duplicar operações
        if ($purchase->status === "Completed") {
            return response()->json(["message" => "Already completed"], 200);
        }
        if ($purchase->status === "Failed" && $data["status"] === "failed") {
            return response()->json(["message" => "Already failed"], 200);
        }

        if ($data["status"] === "failed") {
            $purchase->status = "Failed";
            $purchase->custom = array_merge((array) $purchase->custom, [
                "provider_data" => $data["provider_data"] ?? null,
            ]);
            $purchase->save();
            return response()->json(["message" => "Marked as failed"], 200);
        }

        // status === success -> criar coin_transaction e creditar user atomically
        return DB::transaction(function () use ($purchase, $data) {
            // Recarrega com lock para evitar condições de corrida
            $purchase = CoinPurchase::where("id", $purchase->id)
                ->lockForUpdate()
                ->first();

            // Se alguém já completou enquanto esperávamos
            if ($purchase->status === "Completed") {
                return response()->json(
                    ["message" => "Already completed"],
                    200,
                );
            }

            // Determinar coins a creditar. Aqui assumimos a conversão: 1 euro = 10 coins (exemplo)
            // Ajusta a fórmula se necessário.
            $coins = (int) round($purchase->euros * 10);

            // Obter o CoinTransactionType "Coin purchase"
            $type = CoinTransactionType::where(
                "name",
                "Coin purchase",
            )->first();
            if (!$type) {
                // fallback se não existir
                $type = CoinTransactionType::where(
                    "type",
                    CoinTransactionType::TYPE_CREDIT,
                )->first();
            }

            // Criar CoinTransaction
            $tx = CoinTransaction::create([
                "transaction_datetime" => Carbon::now(),
                "user_id" => $purchase->user_id,
                "match_id" => null,
                "game_id" => null,
                "coin_transaction_type_id" => $type->id,
                "coins" => $coins,
                "custom" => ["provider_data" => $data["provider_data"] ?? null],
            ]);

            // Atualizar purchase para referenciar a transacção e marcar completed
            $purchase->coin_transaction_id = $tx->id;
            $purchase->status = "Completed";
            $purchase->custom = array_merge((array) $purchase->custom, [
                "provider_data" => $data["provider_data"] ?? null,
            ]);
            $purchase->save();

            // Atualizar saldo do user. Aqui usamos increment atómico.
            User::where("id", $purchase->user_id)->increment(
                "coins_balance",
                $coins,
            );

            return response()->json(
                [
                    "message" => "Purchase confirmed and balance updated",
                    "transaction_id" => $tx->id,
                ],
                200,
            );
        });
    }

    private function validatePaymentReference(
        string $type,
        string $ref,
    ): ?string {
        switch ($type) {
            case CoinPurchase::PAYMENT_MBWAY:
                if (!preg_match('/^9\d{8}$/', $ref)) {
                    return "MBWAY must be 9 digits starting with 9.";
                }
                break;
            case CoinPurchase::PAYMENT_PAYPAL:
                if (!filter_var($ref, FILTER_VALIDATE_EMAIL)) {
                    return "PAYPAL requires a valid email.";
                }
                break;
            case CoinPurchase::PAYMENT_IBAN:
                if (!preg_match('/^[A-Z]{2}\d{23}$/', $ref)) {
                    return "IBAN must be 2 letters followed by 23 digits.";
                }
                break;
            case CoinPurchase::PAYMENT_MB:
                if (!preg_match('/^\d{5}-\d{9}$/', $ref)) {
                    return "MB must be 5 digits, a hyphen, and 9 digits.";
                }
                break;
            case CoinPurchase::PAYMENT_VISA:
                if (!preg_match('/^4\d{15}$/', $ref)) {
                    return "VISA must be 16 digits starting with 4.";
                }
                break;
            default:
                return null;
        }
        return null;
    }

    // Exemplo stub para verificação de assinatura do provider.
    // Implementa conforme o mecanismo do provedor (HMAC, token, header, etc).
    private function verifySignature(Request $request): bool
    {
        // $signature = $request->header('X-PAY-SIGN');
        // $secret = config('payments.provider_secret');
        // return hash_equals($signature, hash_hmac('sha256', $request->getContent(), $secret));
        return true;
    }
}
