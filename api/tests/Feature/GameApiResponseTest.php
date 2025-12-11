<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Deck;
use App\Models\Matches;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GameApiResponseTest extends TestCase
{
    use RefreshDatabase;

    protected User $player1;
    protected User $player2;
    protected Deck $deck;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->player1 = User::factory()->create([
            "type" => "P",
            "coins_balance" => 1000,
        ]);

        $this->player2 = User::factory()->create([
            "type" => "P",
            "coins_balance" => 1000,
        ]);

        // Create test deck
        $this->deck = Deck::create([
            "name" => "Test Deck",
            "slug" => "test-deck",
            "price" => 0,
            "active" => true,
        ]);
    }

    public function test_standalone_game_creation_returns_id_and_201_status()
    {
        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "deck_id" => $this->deck->id,
        ]);

        // Should return 201 status for creation
        $response->assertStatus(201);

        $gameData = $response->json();

        // Should include the game ID
        $this->assertArrayHasKey("id", $gameData);
        $this->assertIsInt($gameData["id"]);
        $this->assertGreaterThan(0, $gameData["id"]);

        // Should include all essential fields
        $this->assertArrayHasKey("match_id", $gameData);
        $this->assertArrayHasKey("player1", $gameData);
        $this->assertArrayHasKey("player2", $gameData);
        $this->assertArrayHasKey("deck", $gameData);
        $this->assertArrayHasKey("type", $gameData);
        $this->assertArrayHasKey("status", $gameData);
        $this->assertArrayHasKey("created_at", $gameData);
        $this->assertArrayHasKey("updated_at", $gameData);

        // Verify the ID can be used for subsequent operations
        $gameId = $gameData["id"];

        // Test starting the game with the returned ID
        $startResponse = $this->postJson("/api/games/{$gameId}/start");
        $startResponse->assertStatus(200);

        // Test finishing the game with the returned ID
        $finishResponse = $this->postJson("/api/games/{$gameId}/finish", [
            "winner_user_id" => $this->player1->id,
        ]);
        $finishResponse->assertStatus(200);
    }

    public function test_match_game_creation_returns_id_and_201_status()
    {
        Sanctum::actingAs($this->player1);

        // First create a match
        $matchResponse = $this->postJson("/api/matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "9",
            "status" => "Playing",
            "stake" => 0,
        ]);

        $matchResponse->assertStatus(201);
        $matchId = $matchResponse->json("id");

        // Create game using the match-specific endpoint
        $gameResponse = $this->postJson("/api/matches/{$matchId}/games", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "status" => "Pending",
        ]);

        // Should return 201 status for creation
        $gameResponse->assertStatus(201);

        $gameData = $gameResponse->json();

        // Should include the game ID
        $this->assertArrayHasKey("id", $gameData);
        $this->assertIsInt($gameData["id"]);
        $this->assertGreaterThan(0, $gameData["id"]);

        // Should be associated with the match
        $this->assertEquals($matchId, $gameData["match_id"]);

        // Should include inherited data from match
        $this->assertEquals("9", $gameData["type"]);
        $this->assertEquals($this->player1->id, $gameData["player1"]["id"]);
        $this->assertEquals($this->player2->id, $gameData["player2"]["id"]);
    }

    public function test_game_creation_with_match_id_returns_consistent_response()
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

        // Create game using regular games endpoint with match_id
        $gameResponse = $this->postJson("/api/games", [
            "match_id" => $matchId,
            "status" => "Pending",
        ]);

        $gameResponse->assertStatus(201);

        $gameData = $gameResponse->json();

        // Should include the game ID
        $this->assertArrayHasKey("id", $gameData);
        $this->assertIsInt($gameData["id"]);

        // Should properly inherit from match
        $this->assertEquals($matchId, $gameData["match_id"]);
        $this->assertEquals("3", $gameData["type"]);
        $this->assertEquals($this->player1->id, $gameData["player1"]["id"]);
        $this->assertEquals($this->player2->id, $gameData["player2"]["id"]);
    }

    public function test_match_creation_also_returns_id_and_201_status()
    {
        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Playing",
            "stake" => 0,
        ]);

        // Should return 201 status for creation
        $response->assertStatus(201);

        $matchData = $response->json();

        // Should include the match ID
        $this->assertArrayHasKey("id", $matchData);
        $this->assertIsInt($matchData["id"]);
        $this->assertGreaterThan(0, $matchData["id"]);

        // Should include all essential fields
        $this->assertArrayHasKey("player1", $matchData);
        $this->assertArrayHasKey("player2", $matchData);
        $this->assertArrayHasKey("type", $matchData);
        $this->assertArrayHasKey("status", $matchData);
        $this->assertArrayHasKey("stake", $matchData);

        // Verify the ID can be used for subsequent operations
        $matchId = $matchData["id"];

        // Test creating a game for this match
        $gameResponse = $this->postJson("/api/matches/{$matchId}/games", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "status" => "Pending",
        ]);
        $gameResponse->assertStatus(201);
    }

    public function test_api_consistency_between_creation_endpoints()
    {
        Sanctum::actingAs($this->player1);

        // Test standalone game creation
        $standaloneResponse = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
            "type" => "3",
        ]);

        $standaloneResponse->assertStatus(201);
        $standaloneData = $standaloneResponse->json();

        // Test match creation
        $matchResponse = $this->postJson("/api/matches", [
            "player1_user_id" => $this->player1->id,
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "status" => "Playing",
            "stake" => 0,
        ]);

        $matchResponse->assertStatus(201);
        $matchData = $matchResponse->json();

        // Both should return 201 status
        $this->assertEquals(201, $standaloneResponse->status());
        $this->assertEquals(201, $matchResponse->status());

        // Both should include ID fields
        $this->assertArrayHasKey("id", $standaloneData);
        $this->assertArrayHasKey("id", $matchData);

        // Both IDs should be positive integers
        $this->assertIsInt($standaloneData["id"]);
        $this->assertIsInt($matchData["id"]);
        $this->assertGreaterThan(0, $standaloneData["id"]);
        $this->assertGreaterThan(0, $matchData["id"]);
    }

    public function test_game_resource_includes_all_relationships()
    {
        Sanctum::actingAs($this->player1);

        $response = $this->postJson("/api/games", [
            "player2_user_id" => $this->player2->id,
            "type" => "3",
            "deck_id" => $this->deck->id,
        ]);

        $response->assertStatus(201);
        $gameData = $response->json();

        // Player relationships should be properly loaded
        $this->assertArrayHasKey("player1", $gameData);
        $this->assertArrayHasKey("player2", $gameData);

        // Player data should include essential fields
        $this->assertArrayHasKey("id", $gameData["player1"]);
        $this->assertArrayHasKey("name", $gameData["player1"]);
        $this->assertArrayHasKey("id", $gameData["player2"]);
        $this->assertArrayHasKey("name", $gameData["player2"]);

        // Deck relationship should be loaded
        $this->assertArrayHasKey("deck", $gameData);
        $this->assertArrayHasKey("id", $gameData["deck"]);
        $this->assertEquals($this->deck->id, $gameData["deck"]["id"]);

        // Winner should be null for new games
        $this->assertNull($gameData["winner"] ?? null);

        // Essential game fields should be present
        $this->assertArrayHasKey("type", $gameData);
        $this->assertArrayHasKey("status", $gameData);
        $this->assertArrayHasKey("began_at", $gameData);
        $this->assertArrayHasKey("ended_at", $gameData);
        $this->assertArrayHasKey("total_time", $gameData);
        $this->assertArrayHasKey("player1_moves", $gameData);
        $this->assertArrayHasKey("player2_moves", $gameData);
    }
}
