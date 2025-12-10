<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user creation with factory
     */
    public function test_user_can_be_created()
    {
        $user = User::factory()->create([
            "name" => "John Doe",
            "email" => "john@example.com",
            "nickname" => "johndoe",
            "type" => "P",
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals("John Doe", $user->name);
        $this->assertEquals("john@example.com", $user->email);
        $this->assertEquals("johndoe", $user->nickname);
        $this->assertEquals("P", $user->type);
    }

    /**
     * Test password is hashed when created
     */
    public function test_password_is_hashed()
    {
        $user = User::factory()->create([
            "password" => "plain-password",
        ]);

        $this->assertNotEquals("plain-password", $user->password);
        $this->assertTrue(password_verify("plain-password", $user->password));
    }

    /**
     * Test isBlocked method returns false by default
     */
    public function test_is_blocked_returns_false_by_default()
    {
        $user = User::factory()->create(["blocked" => false]);

        $this->assertFalse($user->isBlocked());
    }

    /**
     * Test isBlocked method returns true when user is blocked
     */
    public function test_is_blocked_returns_true_when_blocked()
    {
        $user = User::factory()->create(["blocked" => true]);

        $this->assertTrue($user->isBlocked());
    }

    /**
     * Test isType method
     */
    public function test_is_type_method()
    {
        $player = User::factory()->create(["type" => "P"]);
        $admin = User::factory()->create(["type" => "A"]);

        $this->assertTrue($player->isType("P"));
        $this->assertFalse($player->isType("A"));
        $this->assertTrue($admin->isType("A"));
        $this->assertFalse($admin->isType("P"));
    }

    /**
     * Test getBalance method
     */
    public function test_get_balance_method()
    {
        $user = User::factory()->create(["coins_balance" => 150]);

        $this->assertEquals(150, $user->getBalance());
        $this->assertIsInt($user->getBalance());
    }

    /**
     * Test getBalance method with zero balance
     */
    public function test_get_balance_with_zero_balance()
    {
        $user = User::factory()->create(["coins_balance" => 0]);

        $this->assertEquals(0, $user->getBalance());
    }

    /**
     * Test coins_balance is cast to integer
     */
    public function test_coins_balance_is_cast_to_integer()
    {
        $user = User::factory()->create(["coins_balance" => "100"]);

        $this->assertIsInt($user->coins_balance);
        $this->assertEquals(100, $user->coins_balance);
    }

    /**
     * Test blocked is cast to boolean
     */
    public function test_blocked_is_cast_to_boolean()
    {
        $user = User::factory()->create(["blocked" => 1]);

        $this->assertIsBool($user->blocked);
        $this->assertTrue($user->blocked);

        $user = User::factory()->create(["blocked" => 0]);

        $this->assertIsBool($user->blocked);
        $this->assertFalse($user->blocked);
    }

    /**
     * Test custom field is cast to array
     */
    public function test_custom_field_is_cast_to_array()
    {
        $customData = ["preference" => "dark_mode", "level" => 5];
        $user = User::factory()->create(["custom" => $customData]);

        $this->assertIsArray($user->custom);
        $this->assertEquals($customData, $user->custom);
    }

    /**
     * Test fillable attributes
     */
    public function test_fillable_attributes()
    {
        $attributes = [
            "name" => "Jane Doe",
            "email" => "jane@example.com",
            "password" => "password123",
            "type" => "admin",
            "nickname" => "janedoe",
            "blocked" => false,
            "photo_avatar_filename" => "avatar.jpg",
            "coins_balance" => 200,
            "custom" => ["theme" => "light"],
        ];

        $user = new User($attributes);

        foreach ($attributes as $key => $value) {
            if ($key === "custom") {
                $this->assertEquals($value, $user->$key);
            } else {
                $this->assertNotNull($user->$key);
            }
        }
    }

    /**
     * Test hidden attributes are not visible in array
     */
    public function test_hidden_attributes_are_not_visible()
    {
        $user = User::factory()->create([
            "password" => "secret-password",
        ]);

        $userArray = $user->toArray();

        $this->assertArrayNotHasKey("password", $userArray);
        $this->assertArrayNotHasKey("remember_token", $userArray);
    }

    /**
     * Test soft deletes functionality
     */
    public function test_soft_deletes_functionality()
    {
        $user = User::factory()->create();
        $userId = $user->id;

        $user->delete();

        // User should not be found in normal queries
        $this->assertNull(User::find($userId));

        // But should be found with trashed
        $this->assertNotNull(User::withTrashed()->find($userId));
        $this->assertTrue(User::withTrashed()->find($userId)->trashed());
    }

    /**
     * Test user can be restored from soft delete
     */
    public function test_user_can_be_restored()
    {
        $user = User::factory()->create();
        $userId = $user->id;

        $user->delete();
        $this->assertNull(User::find($userId));

        User::withTrashed()->find($userId)->restore();

        $this->assertNotNull(User::find($userId));
        $this->assertFalse(User::find($userId)->trashed());
    }

    /**
     * Test user email must be unique
     */
    public function test_email_must_be_unique()
    {
        User::factory()->create(["email" => "test@example.com"]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        User::factory()->create(["email" => "test@example.com"]);
    }

    /**
     * Test user types are correctly handled
     */
    public function test_user_types()
    {
        $validTypes = ["P", "A"];

        foreach ($validTypes as $type) {
            $user = User::factory()->create(["type" => $type]);
            $this->assertEquals($type, $user->type);
            $this->assertTrue($user->isType($type));
        }
    }
}
