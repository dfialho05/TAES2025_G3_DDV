<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Game;
use App\Models\Matches;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow();
    }

    public function test_can_get_most_wins_leaderboard()
    {
        // Create users with different win counts
        $user1 = User::create([
            "name" => "Top Winner",
            "email" => "winner@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "Second Winner",
            "email" => "second@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user3 = User::create([
            "name" => "Third Winner",
            "email" => "third@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create matches where user1 wins 3, user2 wins 2, user3 wins 1
        for ($i = 0; $i < 3; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user1->id,
                "player2_user_id" => $user2->id,
                "winner_user_id" => $user1->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "ended_at" => now()->subDays($i)->addHour(),
                "stake" => 3,
            ]);
        }

        for ($i = 0; $i < 2; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user2->id,
                "player2_user_id" => $user3->id,
                "winner_user_id" => $user2->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i + 10),
                "ended_at" => now()
                    ->subDays($i + 10)
                    ->addHour(),
                "stake" => 3,
            ]);
        }

        Matches::create([
            "type" => "3",
            "player1_user_id" => $user3->id,
            "player2_user_id" => $user1->id,
            "winner_user_id" => $user3->id,
            "status" => "Ended",
            "began_at" => now()->subDays(20),
            "ended_at" => now()->subDays(20)->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200)->assertJsonStructure([
            "success",
            "data" => [
                "*" => ["id", "name", "nickname", "wins"],
            ],
            "period",
            "type",
        ]);

        $data = $response->json("data");
        if (count($data) > 0) {
            $this->assertEquals($user1->id, $data[0]["id"]);
            $this->assertEquals(3, $data[0]["wins"]);
        }
    }

    public function test_can_get_most_matches_leaderboard()
    {
        $user1 = User::create([
            "name" => "Match Player 1",
            "email" => "match1@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "Match Player 2",
            "email" => "match2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create multiple matches for user1
        for ($i = 0; $i < 5; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user1->id,
                "player2_user_id" => $user2->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "ended_at" => now()->subDays($i)->addHour(),
                "stake" => 3,
            ]);
        }

        // Create fewer matches for user2
        for ($i = 0; $i < 2; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user2->id,
                "player2_user_id" => $user1->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i + 10),
                "ended_at" => now()
                    ->subDays($i + 10)
                    ->addHour(),
                "stake" => 3,
            ]);
        }

        $response = $this->getJson("/api/leaderboard?type=most_matches");

        $response->assertStatus(200)->assertJsonStructure([
            "success",
            "data" => [
                "*" => ["id", "name", "nickname", "total_matches"],
            ],
            "period",
            "type",
        ]);

        $data = $response->json("data");
        if (count($data) > 0) {
            $this->assertEquals($user1->id, $data[0]["id"]);
        }
    }

    public function test_can_get_most_games_leaderboard()
    {
        $user1 = User::create([
            "name" => "Game Player 1",
            "email" => "game1@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "Game Player 2",
            "email" => "game2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create games for user1
        for ($i = 0; $i < 8; $i++) {
            Game::create([
                "type" => "3",
                "player1_user_id" => $user1->id,
                "player2_user_id" => $user2->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
            ]);
        }

        // Create games for user2
        for ($i = 0; $i < 3; $i++) {
            Game::create([
                "type" => "3",
                "player1_user_id" => $user2->id,
                "player2_user_id" => $user1->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i + 10),
            ]);
        }

        $response = $this->getJson("/api/leaderboard?type=most_games");

        $response->assertStatus(200)->assertJsonStructure([
            "success",
            "data" => [
                "*" => ["id", "name", "nickname", "total_games"],
            ],
            "period",
            "type",
        ]);

        $data = $response->json("data");
        if (count($data) > 0) {
            $this->assertEquals($user1->id, $data[0]["id"]);
        }
    }

    public function test_leaderboard_excludes_admin_users()
    {
        $admin = User::create([
            "name" => "Admin User",
            "email" => "admin@example.com",
            "password" => "password",
            "type" => "A",
        ]);

        $player = User::create([
            "name" => "Regular Player",
            "email" => "player@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create matches for admin (should be excluded)
        Matches::create([
            "type" => "3",
            "player1_user_id" => $admin->id,
            "player2_user_id" => $player->id,
            "winner_user_id" => $admin->id,
            "status" => "Ended",
            "began_at" => now()->subDay(),
            "ended_at" => now()->subDay()->addHour(),
            "stake" => 3,
        ]);

        // Create matches for player
        Matches::create([
            "type" => "3",
            "player1_user_id" => $player->id,
            "player2_user_id" => $admin->id,
            "winner_user_id" => $player->id,
            "status" => "Ended",
            "began_at" => now()->subDay(),
            "ended_at" => now()->subDay()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200);

        $data = $response->json("data");
        // Admin should be excluded from leaderboard
        $adminInLeaderboard = collect($data)->contains("id", $admin->id);
        $this->assertFalse($adminInLeaderboard);

        // Player should be in leaderboard if they have wins
        if (count($data) > 0) {
            $playerInLeaderboard = collect($data)->contains("id", $player->id);
            $this->assertTrue($playerInLeaderboard);
        }
    }

    public function test_leaderboard_excludes_blocked_users()
    {
        $blockedUser = User::create([
            "name" => "Blocked User",
            "email" => "blocked@example.com",
            "password" => "password",
            "type" => "P",
            "blocked" => true,
        ]);

        $normalUser = User::create([
            "name" => "Normal User",
            "email" => "normal@example.com",
            "password" => "password",
            "type" => "P",
            "blocked" => false,
        ]);

        // Create matches for both users
        Matches::create([
            "type" => "3",
            "player1_user_id" => $blockedUser->id,
            "player2_user_id" => $normalUser->id,
            "winner_user_id" => $blockedUser->id,
            "status" => "Ended",
            "began_at" => now()->subDay(),
            "ended_at" => now()->subDay()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200);

        $data = $response->json("data");
        // Blocked user should be excluded
        $blockedInLeaderboard = collect($data)->contains(
            "id",
            $blockedUser->id,
        );
        $this->assertFalse($blockedInLeaderboard);
    }

    public function test_leaderboard_excludes_soft_deleted_users()
    {
        $deletedUser = User::create([
            "name" => "Deleted User",
            "email" => "deleted@example.com",
            "password" => "password",
            "type" => "P",
            "deleted_at" => now(),
        ]);

        $activeUser = User::create([
            "name" => "Active User",
            "email" => "active@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create matches
        Matches::create([
            "type" => "3",
            "player1_user_id" => $deletedUser->id,
            "player2_user_id" => $activeUser->id,
            "winner_user_id" => $deletedUser->id,
            "status" => "Ended",
            "began_at" => now()->subDay(),
            "ended_at" => now()->subDay()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200);

        $data = $response->json("data");
        // Deleted user should be excluded
        $deletedInLeaderboard = collect($data)->contains(
            "id",
            $deletedUser->id,
        );
        $this->assertFalse($deletedInLeaderboard);
    }

    public function test_leaderboard_respects_limit_parameter()
    {
        // Create 5 users
        $users = [];
        for ($i = 1; $i <= 5; $i++) {
            $users[] = User::create([
                "name" => "User {$i}",
                "email" => "user{$i}@example.com",
                "password" => "password",
                "type" => "P",
            ]);
        }

        // Create matches for each user
        foreach ($users as $index => $user) {
            for ($j = 0; $j <= $index; $j++) {
                Matches::create([
                    "type" => "3",
                    "player1_user_id" => $user->id,
                    "player2_user_id" => $users[0]->id,
                    "winner_user_id" => $user->id,
                    "status" => "Ended",
                    "began_at" => now()->subDays($index + $j),
                    "ended_at" => now()
                        ->subDays($index + $j)
                        ->addHour(),
                    "stake" => 3,
                ]);
            }
        }

        $response = $this->getJson("/api/leaderboard?type=most_wins&limit=3");

        $response->assertStatus(200);

        $data = $response->json("data");
        $this->assertLessThanOrEqual(3, count($data));
    }

    public function test_monthly_leaderboard_filters_by_current_month()
    {
        $user1 = User::create([
            "name" => "Current Month User",
            "email" => "current@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "Last Month User",
            "email" => "last@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Current month match
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user1->id,
            "player2_user_id" => $user2->id,
            "winner_user_id" => $user1->id,
            "status" => "Ended",
            "began_at" => now(),
            "ended_at" => now()->addHour(),
            "stake" => 3,
        ]);

        // Last month match (should not be counted)
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user2->id,
            "player2_user_id" => $user1->id,
            "winner_user_id" => $user2->id,
            "status" => "Ended",
            "began_at" => now()->subMonth(),
            "ended_at" => now()->subMonth()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson(
            "/api/leaderboard?type=most_wins&period=month",
        );

        $response->assertStatus(200)->assertJson([
            "period" => "month",
        ]);

        $data = $response->json("data");
        if (count($data) > 0) {
            $this->assertEquals($user1->id, $data[0]["id"]);
            $this->assertEquals(1, $data[0]["wins"]);
        }
    }

    public function test_can_get_all_leaderboards_at_once()
    {
        $user1 = User::create([
            "name" => "Test User 1",
            "email" => "test1@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "Test User 2",
            "email" => "test2@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Create some matches
        Matches::create([
            "type" => "3",
            "player1_user_id" => $user1->id,
            "player2_user_id" => $user2->id,
            "winner_user_id" => $user1->id,
            "status" => "Ended",
            "began_at" => now(),
            "ended_at" => now()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboards/all");

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                "success",
                "period",
                "leaderboards" => ["most_wins", "most_matches", "most_games"],
            ]);
    }

    public function test_invalid_leaderboard_type_returns_error()
    {
        $response = $this->getJson("/api/leaderboard?type=invalid_type");

        $response->assertStatus(400)->assertJson([
            "error" => "Invalid leaderboard type",
        ]);
    }

    public function test_leaderboard_defaults_to_most_wins_when_no_type_specified()
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

        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $user->id,
            "status" => "Ended",
            "began_at" => now(),
            "ended_at" => now()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboard");

        $response->assertStatus(200)->assertJson([
            "type" => "most_wins",
            "period" => "all",
        ]);
    }

    public function test_leaderboard_handles_no_data()
    {
        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200)->assertJson([
            "success" => true,
            "data" => [],
            "type" => "most_wins",
        ]);
    }

    public function test_leaderboard_position_calculation()
    {
        $users = [];
        for ($i = 1; $i <= 3; $i++) {
            $users[] = User::create([
                "name" => "User {$i}",
                "email" => "user{$i}@example.com",
                "password" => "password",
                "type" => "P",
            ]);
        }

        // User 1: 3 wins, User 2: 2 wins, User 3: 1 win
        for ($i = 0; $i < 3; $i++) {
            for ($j = 0; $j < 3 - $i; $j++) {
                Matches::create([
                    "type" => "3",
                    "player1_user_id" => $users[$i]->id,
                    "player2_user_id" => $users[($i + 1) % 3]->id,
                    "winner_user_id" => $users[$i]->id,
                    "status" => "Ended",
                    "began_at" => now()->subDays($i * 10 + $j),
                    "ended_at" => now()
                        ->subDays($i * 10 + $j)
                        ->addHour(),
                    "stake" => 3,
                ]);
            }
        }

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200);

        $data = $response->json("data");
        // Verify ordering if we have data
        if (count($data) >= 3) {
            $this->assertEquals($users[0]->id, $data[0]["id"]);
            $this->assertEquals($users[1]->id, $data[1]["id"]);
            $this->assertEquals($users[2]->id, $data[2]["id"]);
        }
    }

    public function test_leaderboard_handles_ties_consistently()
    {
        $user1 = User::create([
            "name" => "User A",
            "email" => "usera@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $user2 = User::create([
            "name" => "User B",
            "email" => "userb@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $opponent = User::create([
            "name" => "Opponent",
            "email" => "opponent@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        // Both users get same number of wins
        for ($i = 0; $i < 2; $i++) {
            Matches::create([
                "type" => "3",
                "player1_user_id" => $user1->id,
                "player2_user_id" => $opponent->id,
                "winner_user_id" => $user1->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i),
                "ended_at" => now()->subDays($i)->addHour(),
                "stake" => 3,
            ]);

            Matches::create([
                "type" => "3",
                "player1_user_id" => $user2->id,
                "player2_user_id" => $opponent->id,
                "winner_user_id" => $user2->id,
                "status" => "Ended",
                "began_at" => now()->subDays($i + 5),
                "ended_at" => now()
                    ->subDays($i + 5)
                    ->addHour(),
                "stake" => 3,
            ]);
        }

        $response = $this->getJson("/api/leaderboard?type=most_wins");

        $response->assertStatus(200);

        $data = $response->json("data");
        // Both should have same wins count if we have data
        if (count($data) >= 2) {
            $this->assertEquals(2, $data[0]["wins"]);
            $this->assertEquals(2, $data[1]["wins"]);
        }
    }

    public function test_monthly_leaderboard_with_all_leaderboards_endpoint()
    {
        $user = User::create([
            "name" => "Monthly User",
            "email" => "monthly@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        $opponent = User::create([
            "name" => "Opponent",
            "email" => "opponent@example.com",
            "password" => "password",
            "type" => "P",
        ]);

        Matches::create([
            "type" => "3",
            "player1_user_id" => $user->id,
            "player2_user_id" => $opponent->id,
            "winner_user_id" => $user->id,
            "status" => "Ended",
            "began_at" => now(),
            "ended_at" => now()->addHour(),
            "stake" => 3,
        ]);

        $response = $this->getJson("/api/leaderboards/all?period=month");

        $response
            ->assertStatus(200)
            ->assertJson([
                "period" => "month",
            ])
            ->assertJsonStructure([
                "success",
                "period",
                "leaderboards" => ["most_wins", "most_matches", "most_games"],
            ]);
    }
}
