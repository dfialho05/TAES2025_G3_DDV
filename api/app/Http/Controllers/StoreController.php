<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Deck;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    // 1. Listar Baralhos
    public function index()
    {
        return response()->json([
            'data' => Deck::where('active', true)->get()
        ]);
    }

    // 2. Comprar Baralho
    public function buy(Request $request)
    {
        $request->validate([
            'deck_id' => 'required|integer|exists:decks,id',
        ]);
        
        $user = $request->user();
        $deck = Deck::find($request->input('deck_id'));

        // --- A. LÓGICA DE INVENTÁRIO (JSON) ---
        $customData = $user->custom ?? [];
        if (!isset($customData['decks'])) {
            $customData['decks'] = [];
        }

        // Verifica se já tem o baralho
        // (Nota: Assume-se que o deck ID 1 é o default e todos têm)
        if (in_array($deck->id, $customData['decks'])) {
            return response()->json(['message' => 'Já tens este baralho!'], 422);
        }

        // --- B. VERIFICAR SALDO ---
        // Usa coins_balance conforme o teu User model
        if ($user->coins_balance < $deck->price) {
            return response()->json(['message' => 'Moedas insuficientes'], 400);
        }

        // --- C. TRANSAÇÃO ATÓMICA ---
        try {
            DB::beginTransaction();

            // 1. Obter ou Criar o Tipo de Transação "Compra de Item" (Débito)
            $transactionType = CoinTransactionType::firstOrCreate(
                ['name' => 'Item Purchase'], // Procura por este nome
                [
                    'type' => CoinTransactionType::TYPE_DEBIT, // 'D'
                    'custom' => ['description' => 'Purchase of store items']
                ]
            );

            // 2. Descontar Moedas do User
            $user->coins_balance -= $deck->price;

            // 3. Adicionar Deck ao Inventário
            $customData['decks'][] = $deck->id;
            $user->custom = $customData; 
            $user->save();

            // 4. Criar o Registo na Tabela CoinTransaction (O Teu Modelo)
            CoinTransaction::create([
                'user_id' => $user->id,
                'coin_transaction_type_id' => $transactionType->id,
                'transaction_datetime' => now(),
                'coins' => -$deck->price, // Valor negativo para indicar saída
                // match_id e game_id ficam null pois é uma compra de loja
                'custom' => [
                    'item_type' => 'deck',
                    'item_id' => $deck->id,
                    'item_name' => $deck->name,
                    'balance_after' => $user->coins_balance
                ]
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Baralho comprado com sucesso!',
                'balance' => $user->coins_balance,
                'my_decks' => $customData['decks']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao processar compra', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 3. Equipar Baralho (Atualizado para o teu contexto)
    public function toggleActive(Request $request)
    {
        $request->validate(['deck_id' => 'required|exists:decks,id']);
        
        $user = $request->user();
        $deckId = $request->input('deck_id');
        
        $customData = $user->custom ?? [];
        $myDecks = $customData['decks'] ?? [];
        
        // Permite equipar se tiver comprado OU se for o default (ID 1)
        if (!in_array($deckId, $myDecks) && $deckId != 1) { 
             return response()->json(['message' => 'Não tens este baralho!'], 403);
        }
    
        $customData['active_deck_id'] = $deckId;
        
        $user->custom = $customData;
        $user->save();
    
        return response()->json([
            'message' => 'Baralho equipado!',
            'active_deck_id' => $deckId
        ]);
    }
}