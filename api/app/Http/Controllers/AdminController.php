<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Game;

class AdminController extends Controller
{
    // --- ESTATÍSTICAS ---
    public function getStatistics()
    {
        $newUsers = User::where('created_at', '>=', now()->subDays(7))->count();

        // Calcular total de moedas em circulação (Inflação do jogo)
        // Nota: Confirma se a coluna na tabela users se chama 'brain_coins' ou 'coins'
        $totalEconomy = User::sum('coins_balance'); 

        return response()->json([
            'total_users' => User::count(),
            'new_users_week' => $newUsers,
            'active_games' => Game::where('status', 'PL')->count(),
            'total_games' => Game::count(),
            'total_decks' => DB::table('decks')->count(),
            'total_economy' => $totalEconomy,
        ]);
    }

    // --- GESTÃO DE BARALHOS ---

    // 1. Listar todos os baralhos
    public function getDecks()
    {
        $decks = DB::table('decks')->where('id', '!=', 1)->orderBy('id', 'desc')->get();
        return response()->json($decks);
    }

    // --- CRIAR BARALHO (SIMPLIFICADO) ---
    public function storeDeck(Request $request)
    {
        // Aumentar tempo e memória para upload de ~40 ficheiros
        ini_set('max_execution_time', 300);
        ini_set('memory_limit', '512M');

        $request->validate([
            'name' => 'required|string|max:50',
            'price' => 'required|integer|min:0',
            'image_preview' => 'required|image|max:51200', // Capa da Loja
            'image_back' => 'required|image|max:5120',    // Costas da Carta
            'game_cards' => 'required|array',              // Array de cartas
            'game_cards.*' => 'image|max:5120',            // Cada ficheiro tem de ser imagem
        ]);

        try {
            DB::beginTransaction();

            // 1. Criar Pasta
            $slug = Str::slug($request->name);
            $path = "decks/{$slug}";

            if (DB::table('decks')->where('slug', $slug)->exists()) {
                return response()->json(['message' => 'Já existe um baralho com este nome.'], 409);
            }

            // 2. Inserir na BD
            $deckId = DB::table('decks')->insertGetId([
                'name' => $request->name,
                'slug' => $slug,
                'price' => $request->price,
                'active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Upload: Capa e Costas (Mantemos separado para garantir que existem)
            $request->file('image_preview')->storeAs($path, 'preview.png', 'public');
            $request->file('image_back')->storeAs($path, 'semFace.png', 'public');

            // 4. Upload: Cartas de Jogo (Mantendo o nome original)
            foreach ($request->file('game_cards') as $file) {
                // O segredo está aqui: usamos o nome que o ficheiro já traz
                $filename = $file->getClientOriginalName();
                $file->storeAs($path, $filename, 'public');
            }

            DB::commit();
            return response()->json(['message' => 'Baralho criado com sucesso!'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Storage::disk('public')->deleteDirectory("decks/" . Str::slug($request->name));
            return response()->json(['message' => 'Erro: ' . $e->getMessage()], 500);
        }
    }

    // 3. Atualizar Estado (Ativar/Desativar)
    public function toggleDeck($id)
    {
        if ($id == 1) {
            return response()->json(['message' => 'O baralho clássico não pode ser desativado.'], 403);
        }       

        $deck = DB::table('decks')->find($id);
        if (!$deck) return response()->json(['message' => 'Baralho não encontrado'], 404);

        $newState = !$deck->active;
        DB::table('decks')->where('id', $id)->update(['active' => $newState, 'updated_at' => now()]);

        return response()->json(['active' => $newState]);
    }

    // 4. Apagar Baralho
    public function deleteDeck($id)
    {
        if ($id == 1) {
            return response()->json(['message' => 'O baralho clássico não pode ser eliminado.'], 403);
        }

        $deck = DB::table('decks')->find($id);
        if (!$deck) return response()->json(['message' => 'Baralho não encontrado'], 404);

        // 1. Apagar ficheiros
        Storage::disk('public')->deleteDirectory("decks/{$deck->slug}");

        // 2. Apagar da BD
        DB::table('decks')->delete($id);

        return response()->json(['message' => 'Baralho eliminado.']);
    }
}