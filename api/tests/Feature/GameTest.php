<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GameTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste: Listar todos os jogos (Public Index).
     */
    public function test_can_list_games()
    {
        // Cria users primeiro
        $player1 = User::create([
            "name" => "Player 1",
            "email" => "player1@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $player2 = User::create([
            "name" => "Player 2",
            "email" => "player2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Cria 3 jogos
        for ($i = 1; $i <= 3; $i++) {
            Game::create([
                "type" => "3",
                "player1_user_id" => $player1->id,
                "player2_user_id" => $player2->id,
                "status" => "Pending",
                "began_at" => now(),
            ]);
        }

        $response = $this->getJson("/api/games");

        $response->assertStatus(200)->assertJsonStructure([
            "data" => [
                "*" => [
                    "player1" => ["id", "name", "email"],
                    "type",
                    "status",
                    "player1_moves",
                    "total_time",
                ],
            ],
        ]);
    }

    /**
     * Teste: Ver um jogo específico (Public Show).
     */
    public function test_can_show_game()
    {
        $player1 = User::create([
            "name" => "Player 1",
            "email" => "player1@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $player2 = User::create([
            "name" => "Player 2",
            "email" => "player2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $game = Game::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Pending",
            "began_at" => now(),
        ]);

        $response = $this->getJson("/api/games/{$game->id}");

        $response->assertStatus(200)->assertJsonStructure([
            "data" => [
                "player1" => ["id", "name", "email"],
                "type",
                "status",
                "player1_moves",
                "total_time",
            ],
        ]);
    }

    /**
     * Teste: Jogos Recentes (Lógica customizada e Limite de 10).
     */
    public function test_recent_games_logic_and_structure()
    {
        $user = User::create([
            "name" => "Hero",
            "email" => "hero@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $opponent = User::create([
            "name" => "Villain",
            "email" => "villain@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Criar 5 jogos antigos (não devem aparecer todos)
        for ($i = 1; $i <= 5; $i++) {
            Game::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now()->subDays(10),
            ]);
        }

        // Criar 10 jogos recentes
        for ($i = 1; $i <= 10; $i++) {
            Game::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now(),
            ]);
        }

        $response = $this->getJson("/api/users/{$user->id}/games/recent");

        $response->assertStatus(200);

        // 1. Verifica se limitou a 10 jogos
        $this->assertCount(10, $response->json());

        // 2. Verifica a estrutura customizada do Controller (ex: campo 'opponent')
        $response->assertJsonStructure([
            "*" => [
                "id",
                "type",
                "status",
                "opponent" => ["id", "name", "nickname"],
                "is_winner",
            ],
        ]);

        // 3. Verifica se a lógica de detetar o oponente funcionou
        $data = $response->json();
        $this->assertEquals("Villain", $data[0]["opponent"]["name"]);
    }

    /**
     * Teste: Jogos Recentes retorna 404 se user não existe.
     */
    public function test_recent_games_user_not_found()
    {
        $response = $this->getJson("/api/users/99999/games/recent");
        $response
            ->assertStatus(404)
            ->assertJson(["message" => "User not found"]);
    }

    /**
     * Teste: Estatísticas do utilizador (User Stats).
     */
    public function test_user_stats_calculations()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $opponent = User::create([
            "name" => "Opponent",
            "email" => "opponent@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // 1 Jogo Ganho
        Game::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $user->id,
            "status" => "Ended",
            "began_at" => now(),
        ]);

        // 1 Jogo Perdido
        Game::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now(),
        ]);

        // 1 Jogo em empate ou a decorrer (não conta como ganho, mas conta para total)
        Game::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => null,
            "status" => "Playing",
            "began_at" => now(),
        ]);

        $response = $this->getJson("/api/users/{$user->id}/games/stats");

        $response->assertStatus(200)->assertJson([
            "user_id" => $user->id,
            "total_games" => 3,
            "won_games" => 1,
            "lost_games" => 2,
            "win_rate" => 33.33,
        ]);
    }

    /**
     * Teste: Games by Match - Segurança (Apenas participantes ou Admin).
     */
    public function test_games_by_match_security()
    {
        $player = User::create([
            "name" => "Player",
            "email" => "player@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $player2 = User::create([
            "name" => "Player 2",
            "email" => "player2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $stranger = User::create([
            "name" => "Stranger",
            "email" => "stranger@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $admin = User::create([
            "name" => "Admin",
            "email" => "admin@example.com",
            "password" => "password",
            "type" => "A",
        ]);

        // Criar uma partida (Match)
        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now(),
        ]);

        // Criar jogos associados a essa match
        Game::create([
            "type" => "3",
            "match_id" => $match->id,
            "player1_user_id" => $player->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now(),
        ]);

        Game::create([
            "type" => "3",
            "match_id" => $match->id,
            "player1_user_id" => $player->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now(),
        ]);

        // Cenário 1: Participante tenta aceder (Sucesso)
        Sanctum::actingAs($player);
        $response = $this->getJson("/api/matches/{$match->id}/games");
        $response->assertStatus(200)->assertJsonCount(2);

        // Cenário 2: Estranho tenta aceder (Forbidden)
        Sanctum::actingAs($stranger);
        $response = $this->getJson("/api/matches/{$match->id}/games");
        $response->assertStatus(403);

        // Cenário 3: Admin tenta aceder (Sucesso)
        Sanctum::actingAs($admin);
        $response = $this->getJson("/api/matches/{$match->id}/games");
        $response->assertStatus(200);
    }

    /**
     * Teste: Apagar jogo (Protected Destroy).
     */
    public function test_can_delete_game()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $player2 = User::create([
            "name" => "Player 2",
            "email" => "player2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $game = Game::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $player2->id,
            "status" => "Pending",
            "began_at" => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/games/{$game->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing("games", ["id" => $game->id]);
    }
}
