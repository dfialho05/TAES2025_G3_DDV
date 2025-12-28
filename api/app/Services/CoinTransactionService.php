<?php namespace App\Services;

use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CoinTransactionService
{
    /**
     * Cria uma transação de CRÉDITO (dar moedas) e atualiza o saldo do utilizador atomicamente.
     * Usado para: Coin Purchase (imediato), Match Payout, Bonus.
     *
     * @param User $user O utilizador a creditar.
     * @param string $typeName O nome do tipo de transação (ex: "Coin purchase", "Match payout").
     * @param int $coins O número de moedas (DEVE ser positivo).
     * @param array $relatedIds IDs de Match, Game ou Custom.
     * @param array $custom Dados customizados para a transação.
     * @return CoinTransaction A transação criada.
     *
     * @throws \InvalidArgumentException
     * @throws \Exception Se o utilizador for administrador (não pode receber/ter moedas).
     */
    public function createCreditTransaction(
        User $user,
        string $typeName,
        int $coins,
        array $relatedIds = [],
        array $custom = [],
    ): CoinTransaction {
        if ($coins <= 0) {
            throw new \InvalidArgumentException(
                "Credit amount must be positive.",
            );
        }

        // Impedir administradores de receber/ter moedas
        if (method_exists($user, "isType") && $user->isType("A")) {
            throw new \Exception(
                "Administradores não podem comprar, receber ou manter moedas.",
            );
        }

        return DB::transaction(function () use (
            $user,
            $typeName,
            $coins,
            $relatedIds,
            $custom,
        ) {
            // 1. Obter o tipo de transação (fallback seguro)
            $txType = CoinTransactionType::where("name", $typeName)
                ->where("type", CoinTransactionType::TYPE_CREDIT)
                ->first();

            // Se não encontrar pelo nome exato, tenta pegar o genérico de Crédito para não falhar
            if (!$txType) {
                $txType = CoinTransactionType::where(
                    "type",
                    CoinTransactionType::TYPE_CREDIT,
                )->firstOrFail();
            }

            // 2. Criar CoinTransaction com o valor CORRETO imediato
            $tx = CoinTransaction::create([
                "transaction_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "match_id" => $relatedIds["match_id"] ?? null,
                "game_id" => $relatedIds["game_id"] ?? null,
                "coin_transaction_type_id" => $txType->id,
                "coins" => $coins, // Valor real positivo
                "custom" => $custom,
            ]);

            // 3. Atualizar saldo do user (incremento atómico)
            User::where("id", $user->id)->increment("coins_balance", $coins);

            return $tx;
        });
    }

    /**
     * Cria uma transação de DÉBITO (retirar moedas).
     *
     * @throws \InvalidArgumentException
     * @throws \Exception Se saldo insuficiente ou se o utilizador for administrador.
     */
    public function createDebitTransaction(
        User $user,
        string $typeName,
        int $coins,
        array $relatedIds = [],
        array $custom = [],
    ): CoinTransaction {
        if ($coins <= 0) {
            throw new \InvalidArgumentException(
                "Debit amount must be positive.",
            );
        }

        // Impedir administradores de realizar transações de moedas
        if (method_exists($user, "isType") && $user->isType("A")) {
            throw new \Exception(
                "Administradores não podem comprar, receber ou manter moedas.",
            );
        }

        return DB::transaction(function () use (
            $user,
            $typeName,
            $coins,
            $relatedIds,
            $custom,
        ) {
            $user = User::where("id", $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Verificação adicional após lock para garantir que o tipo não mudou
            if (method_exists($user, "isType") && $user->isType("A")) {
                throw new \Exception(
                    "Administradores não podem comprar, receber ou manter moedas.",
                );
            }

            $txType = CoinTransactionType::where("name", $typeName)
                ->where("type", CoinTransactionType::TYPE_DEBIT)
                ->firstOrFail();

            if ($user->coins_balance < $coins) {
                throw new \Exception("Insufficient balance.");
            }

            $tx = CoinTransaction::create([
                "transaction_datetime" => Carbon::now(),
                "user_id" => $user->id,
                "match_id" => $relatedIds["match_id"] ?? null,
                "game_id" => $relatedIds["game_id"] ?? null,
                "coin_transaction_type_id" => $txType->id,
                "coins" => -$coins, // Valor negativo na tabela
                "custom" => $custom,
            ]);

            User::where("id", $user->id)->decrement("coins_balance", $coins);

            return $tx;
        });
    }
}
