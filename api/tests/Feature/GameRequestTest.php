<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Deck;
use App\Models\Matches;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GameRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $player1;
    protected User $player2;
    protected User $admin;
    protected Deck $deck;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->player1 = User::factory()->create([
            "type" => "P",
            "custom" => ["active_deck_id" => 1],
        ]);

        $this->player2 = User::factory()->create([
            "type" => "P",
        ]);

        $this->admin = User::factory()->create([
            "type" => "A",
        ]);

        // Create test deck
        $this->deck = Deck::create([
            "name" => "Test Deck",
            "slug" => "test-deck",
            "price" => 0,
            "active" => true,
        ]);
    }

    public function test_prepare_for_validation_sets_defaults_for_standalone_game()
    {
        Sanctum::actingAs($this->player1);

        // Create game with minimal data - should use defaults
        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
        ]);

        $response->assertStatus(201);

        // Verify defaults were applied
        $gameData = $response->json();

        $this->assertEquals($this->player1->id, $gameData["player1"]["id"]);
        $this->assertEquals($this->player2->id, $gameData["player2"]["id"]);
        $this->assertEquals("3", $gameData["type"]); // Default type
        $this->assertEquals("Pending", $gameData["status"]); // Default status
        $this->assertNotNull($gameData["deck"]); // Default deck should be set
        $this->assertNull($gameData["match_id"]); // Standalone game
    }

    public function test_prepare_for_validation_inherits_from_match()
    {
        Sanctum::actingAs($this->player1);

        // First create a match
        $matchResponse = $this->postJson("/api/matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "9", // Bisca dos 9
            "status" => "Playing",
            "stake" => 0,
        ]);

        $matchResponse->assertStatus(201);
        $matchId = $matchResponse->json("id");

        // Create game for match using regular games endpoint with match_id
        $gameResponse = $this->postJson("/api/games", [
            "match_id" => $matchId,
            "status" => "Pending",
            // No player1_user_id, player2_user_id, or type specified - should inherit from match
        ]);

        $gameResponse->assertStatus(201);

        // Verify inheritance from match
        $gameData = $gameResponse->json();

        $this->assertEquals($matchId, $gameData["match_id"]);
        $this->assertEquals($this->player1->id, $gameData["player1"]["id"]);
        $this->assertEquals($this->player2->id, $gameData["player2"]["id"]);
        $this->assertEquals("9", $gameData["type"]); // Inherited from match
        $this->assertEquals("Pending", $gameData["status"]);
    }

    public function test_prepare_for_validation_uses_authenticated_user_as_player1()
    {
        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
            "type" => "3",
        ]);

        $response->assertStatus(201);

        $gameData = $response->json();
        $this->assertEquals($this->player1->id, $gameData["player1"]["id"]);
    }

    public function test_prepare_for_validation_uses_user_preferred_deck()
    {
        // Set player1's preferred deck
        $this->player1->update([
            "custom" => ["active_deck_id" => $this->deck->id],
        ]);

        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
            // No deck_id specified - should use preferred
        ]);

        $response->assertStatus(201);

        $gameData = $response->json();
        $this->assertEquals($this->deck->id, $gameData["deck"]["id"]);
    }

    public function test_explicit_values_override_defaults()
    {
        Sanctum::actingAs($this->player1);

        // Provide explicit values that should override defaults
        $response = $this->postJson("/api/games", [
            "player1_user_id" => $this->player2->id, // Override authenticated user
            "player2_user_id" => $this->player1->id,
            "type" => "9", // Override default '3'
            "deck_id" => $this->deck->id,
            "status" => "Playing", // Override default 'Pending'
        ]);

        $response->assertStatus(201);

        $gameData = $response->json();

        $this->assertEquals($this->player2->id, $gameData["player1"]["id"]);
        $this->assertEquals($this->player1->id, $gameData["player2"]["id"]);
        $this->assertEquals("9", $gameData["type"]);
        $this->assertEquals($this->deck->id, $gameData["deck"]["id"]);
        $this->assertEquals("Playing", $gameData["status"]);
    }

    public function test_match_players_validation_works()
    {
        Sanctum::actingAs($this->player1);

        // Create a match
        $matchResponse = $this->postJson("/api/matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Playing",
            "stake" => 0,
        ]);

        $matchId = $matchResponse->json("id");

        // Try to create game with wrong players
        $thirdUser = User::factory()->create(["type" => "P"]);

        $gameResponse = $this->postJson("/api/games", [
            "match_id" => $matchId,
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $thirdUser->id, // Wrong player
            "type" => "3",
            "status" => "Pending",
        ]);

        $gameResponse->assertStatus(422);
        $gameResponse->assertJsonValidationErrors(["match_id"]);
    }

    public function test_blocked_players_validation()
    {
        // Block player2
        $this->player2->update(["blocked" => true]);

        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(["player2_user_id"]);
    }
}
