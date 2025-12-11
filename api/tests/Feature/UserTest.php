<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_all_users()
    {
        $user = User::factory()->create();
        User::factory(5)->create();

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/users");

        $response->assertStatus(200)->assertJsonStructure([
            "data" => [
                "*" => ["id", "name", "email", "nickname", "coins_balance"],
            ],
        ]);
    }

    public function test_unauthenticated_user_cannot_get_all_users()
    {
        User::factory(3)->create();

        $response = $this->getJson("/api/users");

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_view_specific_user()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create([
            "name" => "Target User",
            "email" => "target@example.com",
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/users/{$targetUser->id}");

        $response->assertStatus(200)->assertJson([
            "data" => [
                "id" => $targetUser->id,
                "name" => "Target User",
                "email" => "target@example.com",
            ],
        ]);
    }

    public function test_authenticated_user_can_create_new_user()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $userData = [
            "name" => "New User",
            "email" => "newuser@example.com",
            "password" => "password123",
            "nickname" => "newuser123",
        ];

        $response = $this->postJson("/api/users", $userData);

        $response->assertStatus(201)->assertJsonStructure([
            "data" => ["id", "name", "email", "nickname"],
        ]);

        $this->assertDatabaseHas("users", [
            "name" => "New User",
            "email" => "newuser@example.com",
        ]);
    }

    public function test_user_creation_validates_required_fields()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/users", []);

        $response->assertStatus(422);
    }

    public function test_user_creation_validates_unique_email()
    {
        $user = User::factory()->create();
        $existingUser = User::factory()->create([
            "email" => "existing@example.com",
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/users", [
            "name" => "Test User",
            "email" => "existing@example.com",
            "password" => "password123",
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_update_user()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create([
            "name" => "Original Name",
            "email" => "original@example.com",
        ]);

        Sanctum::actingAs($user);

        $updateData = [
            "name" => "Updated Name",
            "nickname" => "updatednick",
        ];

        $response = $this->putJson("/api/users/{$targetUser->id}", $updateData);

        $response->assertStatus(200)->assertJson([
            "data" => [
                "id" => $targetUser->id,
                "name" => "Updated Name",
            ],
        ]);

        $this->assertDatabaseHas("users", [
            "id" => $targetUser->id,
            "name" => "Updated Name",
        ]);
    }

    public function test_user_update_validates_unique_email()
    {
        $user = User::factory()->create();
        $user1 = User::factory()->create(["email" => "user1@example.com"]);
        $user2 = User::factory()->create(["email" => "user2@example.com"]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/users/{$user1->id}", [
            "name" => $user1->name,
            "email" => "user2@example.com", // trying to use existing email
            "password" => "password123",
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_update_photo_url()
    {
        Storage::fake("public");

        $user = User::factory()->create();
        $targetUser = User::factory()->create([
            "photo_avatar_filename" => "old_photo.jpg",
        ]);

        // Create fake old file
        Storage::disk("public")->put(
            "photos_avatars/old_photo.jpg",
            "old content",
        );

        Sanctum::actingAs($user);

        $response = $this->patchJson("/api/users/{$targetUser->id}/photo-url", [
            "photo_url" => "new_photo.jpg",
        ]);

        $response->assertStatus(200)->assertJson([
            "success" => true,
            "user" => [
                "id" => $targetUser->id,
            ],
        ]);

        // Check that old photo was deleted
        Storage::disk("public")->assertMissing("photos_avatars/old_photo.jpg");

        // Check that new filename was saved
        $targetUser->refresh();
        $this->assertEquals(
            "new_photo.jpg",
            $targetUser->photo_avatar_filename,
        );
    }

    public function test_photo_url_update_requires_photo_url_field()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            "/api/users/{$targetUser->id}/photo-url",
            [],
        );

        $response->assertStatus(422)->assertJsonValidationErrors(["photo_url"]);
    }

    public function test_photo_url_update_handles_user_without_existing_photo()
    {
        Storage::fake("public");

        $user = User::factory()->create();
        $targetUser = User::factory()->create([
            "photo_avatar_filename" => null,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson("/api/users/{$targetUser->id}/photo-url", [
            "photo_url" => "path/to/new_photo.jpg",
        ]);

        $response->assertStatus(200)->assertJson(["success" => true]);

        $targetUser->refresh();
        $this->assertEquals(
            "new_photo.jpg",
            $targetUser->photo_avatar_filename,
        );
    }

    public function test_photo_url_update_extracts_filename_from_path()
    {
        Storage::fake("public");

        $user = User::factory()->create();
        $targetUser = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->patchJson("/api/users/{$targetUser->id}/photo-url", [
            "photo_url" => "some/long/path/to/photo.png",
        ]);

        $response->assertStatus(200);

        $targetUser->refresh();
        $this->assertEquals("photo.png", $targetUser->photo_avatar_filename);
    }

    public function test_user_destroy_method_exists_but_not_implemented()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/users/{$targetUser->id}");

        // Since the destroy method is empty, it should return 200 but not actually delete
        $response->assertStatus(200);

        $this->assertDatabaseHas("users", [
            "id" => $targetUser->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_user_endpoints()
    {
        $user = User::factory()->create();

        $response = $this->getJson("/api/users");
        $response->assertStatus(401);

        $response = $this->getJson("/api/users/{$user->id}");
        $response->assertStatus(401);

        $response = $this->postJson("/api/users", []);
        $response->assertStatus(401);

        $response = $this->putJson("/api/users/{$user->id}", []);
        $response->assertStatus(401);

        $response = $this->patchJson("/api/users/{$user->id}/photo-url", []);
        $response->assertStatus(401);

        $response = $this->deleteJson("/api/users/{$user->id}");
        $response->assertStatus(401);
    }

    public function test_nonexistent_user_returns_404()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/users/99999");
        $response->assertStatus(404);

        $response = $this->putJson("/api/users/99999", [
            "name" => "Test",
            "email" => "test@example.com",
        ]);
        $response->assertStatus(404);

        $response = $this->patchJson("/api/users/99999/photo-url", [
            "photo_url" => "test.jpg",
        ]);
        $response->assertStatus(404);
    }
}
