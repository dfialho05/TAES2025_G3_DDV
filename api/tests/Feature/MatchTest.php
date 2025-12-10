<?php

namespace Tests\Feature;

use App\Models\Deck;
use App\Models\Matches;
use App\Models\User;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MatchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a default deck to satisfy foreign key constraints
        Deck::create([
            "name" => "Default Deck",
            "slug" => "default",
            "price" => 0,
            "active" => true,
        ]);
    }

    public function test_non_admin_cannot_get_all_matches()
    {
        $user = User::create([
            "name" => "Regular User",
            "email" => "user@example.com",
            "password" => "password",
            "type" => "P",
        ]);

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

        // Create 3 matches
        for ($i = 0; $i < 3; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $player1->id,
                "player2_user_id" => $player2->id,
                "status" => "Pending",
                "began_at" => now(),
                "stake" => 3,
            ]);
        }

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/matches");

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_get_their_matches()
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

        // Create matches for user
        for ($i = 0; $i < 3; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "stake" => 3,
            ]);
        }

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/matches/me");

        $response->assertStatus(200)->assertJsonStructure([
            "data" => [
                "*" => ["id", "type", "status", "began_at"],
            ],
        ]);
    }

    public function test_can_get_matches_by_user_id()
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

        // Create matches for user
        for ($i = 0; $i < 5; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "stake" => 3,
            ]);
        }

        $response = $this->getJson("/api/matches/user/{$user->id}");

        $response->assertStatus(200)->assertJsonCount(5, "data");
    }

    public function test_matches_by_user_returns_404_for_nonexistent_user()
    {
        $response = $this->getJson("/api/matches/user/99999");
        $response->assertStatus(404);
    }

    public function test_can_get_recent_matches_for_user()
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

        // Create recent matches
        for ($i = 0; $i < 10; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "stake" => 3,
            ]);
        }

        $response = $this->getJson("/api/users/{$user->id}/matches/recent");

        $response->assertStatus(200)->assertJsonStructure([
            "*" => ["id", "type", "status", "opponent", "games"],
        ]);
    }

    public function test_recent_matches_limits_to_8_results()
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

        // Create 15 matches (more than the limit)
        for ($i = 0; $i < 15; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user->id,
                "player2_user_id" => $opponent->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "stake" => 3,
            ]);
        }

        $response = $this->getJson("/api/users/{$user->id}/matches/recent");

        $response->assertStatus(200);
        $this->assertCount(8, $response->json());
    }

    public function test_recent_matches_returns_404_for_nonexistent_user()
    {
        $response = $this->getJson("/api/users/99999/matches/recent");
        $response
            ->assertStatus(404)
            ->assertJson(["message" => "User not found"]);
    }

    public function test_participant_can_view_match_details()
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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        Sanctum::actingAs($player1);

        $response = $this->getJson("/api/matches/{$match->id}");

        $response
            ->assertStatus(200)
            ->assertJsonStructure(["id", "type", "status", "began_at"]);
    }

    public function test_admin_can_view_any_match_details()
    {
        $admin = User::create([
            "name" => "Admin",
            "email" => "admin@example.com",
            "password" => "password",
            "type" => "A",
        ]);

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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/matches/{$match->id}");

        $response->assertStatus(200);
    }

    public function test_non_participant_cannot_view_match_details()
    {
        $stranger = User::create([
            "name" => "Stranger",
            "email" => "stranger@example.com",
            "password" => "password",
            "type" => "P",
        ]);

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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        Sanctum::actingAs($stranger);

        $response = $this->getJson("/api/matches/{$match->id}");

        $response->assertStatus(403);
    }

    public function test_match_creation_validates_required_fields()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/matches", []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["type", "player2_user_id"]);
    }

    public function test_match_creation_validates_user_existence()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/matches", [
            "type" => "3",
            "player2_user_id" => 99999,
            "stake" => 3,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["player2_user_id"]);
    }

    public function test_non_participant_cannot_update_match()
    {
        $stranger = User::create([
            "name" => "Stranger",
            "email" => "stranger@example.com",
            "password" => "password",
            "type" => "P",
        ]);

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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Playing",
            "began_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        Sanctum::actingAs($stranger);

        $response = $this->patchJson("/api/matches/{$match->id}", [
            "status" => "Ended",
        ]);

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_delete_match()
    {
        $user = User::create([
            "name" => "Regular User",
            "email" => "user@example.com",
            "password" => "password",
            "type" => "P",
        ]);

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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $player1->id,
            "player2_user_id" => $player2->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/matches/{$match->id}");

        $response->assertStatus(403);
    }

    public function test_can_get_user_match_stats()
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

        // Create won match
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $user->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        // Create lost match
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now()->subHours(4),
            "ended_at" => now()->subHours(3),
            "stake" => 3,
        ]);

        // Create ongoing match
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "status" => "Playing",
            "began_at" => now()->subMinutes(30),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/users/{$user->id}/matches/stats");

        $response->assertStatus(200)->assertJson([
            "user_id" => $user->id,
            "total_matches" => 3,
            "won_matches" => 1,
            "lost_matches" => 2,
            "win_rate" => 33.33,
        ]);
    }

    public function test_user_stats_handles_no_matches()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $response = $this->getJson("/api/users/{$user->id}/matches/stats");

        $response->assertStatus(200)->assertJson([
            "user_id" => $user->id,
            "total_matches" => 0,
            "won_matches" => 0,
            "lost_matches" => 0,
            "win_rate" => 0,
        ]);
    }

    public function test_user_stats_returns_404_for_nonexistent_user()
    {
        $response = $this->getJson("/api/users/99999/matches/stats");
        $response->assertStatus(404);
    }

    public function test_nonexistent_match_returns_404()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/matches/99999");
        $response->assertStatus(404);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson("/api/matches/me");
        $response->assertStatus(401);

        $response = $this->postJson("/api/matches", []);
        $response->assertStatus(401);
    }

    public function test_recent_matches_includes_opponent_information()
    {
        $user = User::create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => "password",
            "type" => "P",
            "nickname" => "TestNick",
        ]);

        $opponent = User::create([
            "name" => "Opponent User",
            "email" => "opponent@example.com",
            "password" => "password",
            "type" => "P",
            "nickname" => "OpponentNick",
        ]);

        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/users/{$user->id}/matches/recent");

        $response->assertStatus(200)->assertJsonStructure([
            "*" => [
                "opponent" => ["id", "name", "nickname"],
            ],
        ]);

        $data = $response->json();
        $this->assertEquals("Opponent User", $data[0]["opponent"]["name"]);
    }

    public function test_recent_matches_includes_games_information()
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

        $match = Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "ended_at" => now()->subHours(1),
            "stake" => 3,
        ]);

        // Create games for the match
        Game::create([
            "type" => "3",
            "match_id" => $match->id,
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "winner_user_id" => $user->id,
        ]);

        Game::create([
            "type" => "3",
            "match_id" => $match->id,
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "status" => "Ended",
            "began_at" => now()->subHours(2),
            "winner_user_id" => $opponent->id,
        ]);

        $response = $this->getJson("/api/users/{$user->id}/matches/recent");

        $response->assertStatus(200)->assertJsonStructure([
            "*" => [
                "games" => [
                    "*" => ["id", "status"],
                ],
            ],
        ]);

        $data = $response->json();
        $this->assertCount(2, $data[0]["games"]);
    }
}
