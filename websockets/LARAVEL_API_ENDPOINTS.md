# 🔌 Laravel API - Endpoints Necessários para o Sistema de Recuperação

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints Necessários](#endpoints-necessários)
3. [Exemplos de Implementação](#exemplos-de-implementação)
4. [Validações](#validações)
5. [Segurança](#segurança)

---

## 🎯 Visão Geral

O servidor WebSocket necessita dos seguintes endpoints na API Laravel para processar reembolsos e cancelamentos quando o Watchdog detecta timeouts.

**Base URL:** `http://127.0.0.1:8000/api`

---

## 🔌 Endpoints Necessários

### 1. POST `/refund` - Reembolsar Moedas

Adiciona moedas de volta ao saldo do utilizador após timeout/cancelamento.

**Request:**
```json
{
  "user_id": 123,
  "amount": 10,
  "reason": "Game timeout/cancellation",
  "game_id": 42,
  "timestamp": "2025-01-20T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "user_id": 123,
    "old_balance": 90,
    "new_balance": 100,
    "refund_amount": 10,
    "transaction_id": 456,
    "processed_at": "2025-01-20T10:30:01Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid user or amount",
  "errors": {
    "user_id": ["User not found"],
    "amount": ["Amount must be positive"]
  }
}
```

---

### 2. POST `/matches/{matchId}/cancel` - Cancelar Match

Cancela uma match devido a timeout ou erro do servidor.

**Request:**
```json
{
  "status": "Cancelled",
  "reason": "Server timeout - no heartbeat for 2 minutes",
  "cancelled_at": "2025-01-20T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Match cancelled successfully",
  "data": {
    "match_id": 15,
    "status": "Cancelled",
    "reason": "Server timeout - no heartbeat for 2 minutes",
    "cancelled_at": "2025-01-20T10:30:00Z",
    "player1_refunded": true,
    "player2_refunded": true
  }
}
```

---

### 3. POST `/games/{gameId}/cancel` - Cancelar Game

Cancela um game standalone devido a timeout ou erro do servidor.

**Request:**
```json
{
  "status": "Cancelled",
  "reason": "Server crash - player disconnected",
  "cancelled_at": "2025-01-20T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Game cancelled successfully",
  "data": {
    "game_id": 42,
    "status": "Cancelled",
    "reason": "Server crash - player disconnected",
    "cancelled_at": "2025-01-20T10:30:00Z",
    "refunds_processed": 2
  }
}
```

---

## 💻 Exemplos de Implementação (Laravel)

### Controller: `RefundController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RefundController extends Controller
{
    /**
     * Process a refund for a user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function processRefund(Request $request)
    {
        // Validação
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|min:0.01|max:10000',
            'reason' => 'required|string|max:500',
            'game_id' => 'nullable|integer',
            'timestamp' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            // Buscar utilizador
            $user = User::findOrFail($validated['user_id']);
            $oldBalance = $user->coins_balance;

            // Adicionar moedas
            $user->coins_balance += $validated['amount'];
            $user->save();

            // Registar transação
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => $validated['amount'],
                'balance_before' => $oldBalance,
                'balance_after' => $user->coins_balance,
                'reason' => $validated['reason'],
                'game_id' => $validated['game_id'] ?? null,
                'processed_at' => $validated['timestamp'] ?? now(),
                'metadata' => json_encode([
                    'source' => 'websocket_watchdog',
                    'ip' => $request->ip(),
                ]),
            ]);

            DB::commit();

            // Log para auditoria
            Log::info("Refund processed", [
                'user_id' => $user->id,
                'amount' => $validated['amount'],
                'transaction_id' => $transaction->id,
                'reason' => $validated['reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Refund processed successfully',
                'data' => [
                    'user_id' => $user->id,
                    'old_balance' => $oldBalance,
                    'new_balance' => $user->coins_balance,
                    'refund_amount' => $validated['amount'],
                    'transaction_id' => $transaction->id,
                    'processed_at' => $transaction->processed_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Refund failed", [
                'user_id' => $validated['user_id'] ?? null,
                'amount' => $validated['amount'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process refund',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
```

---

### Controller: `MatchController.php` (adicionar método)

```php
<?php

namespace App\Http\Controllers\Api;

use App\Models\Match;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MatchController extends Controller
{
    /**
     * Cancel a match due to timeout or server error
     *
     * @param Request $request
     * @param int $matchId
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $matchId)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Cancelled',
            'reason' => 'required|string|max:500',
            'cancelled_at' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            // Buscar match
            $match = Match::findOrFail($matchId);

            // Verificar se já está terminada ou cancelada
            if (in_array($match->status, ['Finished', 'Cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Match already finished or cancelled',
                ], 400);
            }

            // Atualizar status
            $match->status = 'Cancelled';
            $match->cancelled_reason = $validated['reason'];
            $match->cancelled_at = $validated['cancelled_at'] ?? now();
            $match->save();

            DB::commit();

            // Log
            Log::warning("Match cancelled", [
                'match_id' => $matchId,
                'reason' => $validated['reason'],
                'player1_id' => $match->player1_user_id,
                'player2_id' => $match->player2_user_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Match cancelled successfully',
                'data' => [
                    'match_id' => $match->id,
                    'status' => $match->status,
                    'reason' => $match->cancelled_reason,
                    'cancelled_at' => $match->cancelled_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Match cancellation failed", [
                'match_id' => $matchId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel match',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
```

---

### Controller: `GameController.php` (adicionar método)

```php
<?php

namespace App\Http\Controllers\Api;

use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    /**
     * Cancel a game due to timeout or server error
     *
     * @param Request $request
     * @param int $gameId
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $gameId)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Cancelled',
            'reason' => 'required|string|max:500',
            'cancelled_at' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            // Buscar game
            $game = Game::findOrFail($gameId);

            // Verificar se já está terminado ou cancelado
            if (in_array($game->status, ['Finished', 'Cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Game already finished or cancelled',
                ], 400);
            }

            // Atualizar status
            $game->status = 'Cancelled';
            $game->cancelled_reason = $validated['reason'];
            $game->cancelled_at = $validated['cancelled_at'] ?? now();
            $game->save();

            DB::commit();

            // Log
            Log::warning("Game cancelled", [
                'game_id' => $gameId,
                'reason' => $validated['reason'],
                'player1_id' => $game->player1_user_id,
                'player2_id' => $game->player2_user_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Game cancelled successfully',
                'data' => [
                    'game_id' => $game->id,
                    'status' => $game->status,
                    'reason' => $game->cancelled_reason,
                    'cancelled_at' => $game->cancelled_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Game cancellation failed", [
                'game_id' => $gameId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel game',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
```

---

### Model: `Transaction.php` (exemplo)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'reason',
        'game_id',
        'processed_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'processed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
```

---

### Migration: `add_cancellation_fields.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Adicionar campos de cancelamento às matches
        Schema::table('matches', function (Blueprint $table) {
            $table->string('cancelled_reason')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('cancelled_reason');
        });

        // Adicionar campos de cancelamento aos games
        Schema::table('games', function (Blueprint $table) {
            $table->string('cancelled_reason')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('cancelled_reason');
        });

        // Criar tabela de transações se não existir
        if (!Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('type'); // refund, stake, win, etc
                $table->decimal('amount', 10, 2);
                $table->decimal('balance_before', 10, 2);
                $table->decimal('balance_after', 10, 2);
                $table->string('reason')->nullable();
                $table->foreignId('game_id')->nullable()->constrained()->onDelete('set null');
                $table->timestamp('processed_at');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn(['cancelled_reason', 'cancelled_at']);
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['cancelled_reason', 'cancelled_at']);
        });

        Schema::dropIfExists('transactions');
    }
};
```

---

### Routes: `api.php`

```php
<?php

use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\GameController;
use Illuminate\Support\Facades\Route;

// Refund endpoint (protegido por autenticação)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/refund', [RefundController::class, 'processRefund']);
});

// Match cancellation
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/matches/{match}/cancel', [MatchController::class, 'cancel']);
});

// Game cancellation
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/games/{game}/cancel', [GameController::class, 'cancel']);
});
```

---

## 🔒 Validações

### Regras de Negócio

1. **Refund:**
   - Utilizador deve existir
   - Valor deve ser positivo
   - Não pode exceder valor original da stake
   - Apenas 1 refund por jogo (evitar duplicações)

2. **Cancelamento de Match/Game:**
   - Match/Game deve estar em estado "Playing" ou "Pending"
   - Não pode cancelar jogos já finalizados
   - Razão obrigatória para auditoria

3. **Segurança:**
   - Todas as chamadas devem ser autenticadas
   - Token Bearer necessário
   - Rate limiting recomendado
   - Logs de todas as operações

---

## 🔐 Segurança

### Middleware de Autenticação

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ValidateWebSocketRequest
{
    public function handle(Request $request, Closure $next)
    {
        // Verificar token ou IP do servidor WebSocket
        $allowedIps = ['127.0.0.1', '::1']; // Adicionar IPs dos servidores
        $token = $request->bearerToken();

        if (!$token && !in_array($request->ip(), $allowedIps)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        return $next($request);
    }
}
```

### Rate Limiting

```php
// Em RouteServiceProvider.php
RateLimiter::for('refunds', function (Request $request) {
    return Limit::perMinute(10)->by($request->ip());
});

// Em api.php
Route::middleware(['auth:sanctum', 'throttle:refunds'])->group(function () {
    Route::post('/refund', [RefundController::class, 'processRefund']);
});
```

---

## 📊 Testes

### Teste com cURL

```bash
# Refund
curl -X POST http://127.0.0.1:8000/api/refund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "amount": 10,
    "reason": "Game timeout",
    "game_id": 42
  }'

# Cancel Match
curl -X POST http://127.0.0.1:8000/api/matches/15/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Cancelled",
    "reason": "Server timeout"
  }'

# Cancel Game
curl -X POST http://127.0.0.1:8000/api/games/42/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Cancelled",
    "reason": "Server crash"
  }'
```

---

## 📝 Notas Importantes

1. **Idempotência:** Considere adicionar verificação de duplicação para evitar múltiplos refunds
2. **Auditoria:** Todos os refunds devem ser logados para análise posterior
3. **Notificações:** Considere enviar email/notificação ao utilizador sobre o refund
4. **Relatórios:** Criar dashboard para monitorar refunds e cancelamentos
5. **Testes:** Implementar testes unitários e de integração para estes endpoints

---

**Versão:** 1.0.0  
**Última atualização:** 2025  
**Equipa:** TAES2025_G3_DDV