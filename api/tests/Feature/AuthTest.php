<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    // Limpa a base de dados após cada teste
    use RefreshDatabase;

    /**
     * Teste: Registo de novo utilizador (POST /api/register)
     */
    public function test_user_can_register()
    {
        $payload = [
            "name" => "Novo Jogador",
            "email" => "jogador@example.com",
            "password" => "segredo123",
            "nickname" => "pro_gamer",
        ];

        $response = $this->postJson("/api/register", $payload);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                "token",
                "user" => ["id", "name", "email", "nickname", "coins_balance"],
            ]);

        $this->assertDatabaseHas("users", [
            "email" => "jogador@example.com",
            "nickname" => "pro_gamer",
            "coins_balance" => 10, // Confirma o saldo inicial do controller
        ]);
    }

    /**
     * Teste: Registo com email de conta apagada (Soft Delete).
     * O sistema deve renomear o email antigo e criar a nova conta.
     */
    public function test_user_can_register_with_previously_soft_deleted_email()
    {
        // 1. Criar e apagar um utilizador antigo
        $oldUser = User::factory()->create([
            "email" => "recycle@example.com",
            "deleted_at" => now(), // Simula o soft delete
        ]);

        $payload = [
            "name" => "Jogador Reciclado",
            "email" => "recycle@example.com", // O mesmo email
            "password" => "nova_senha",
        ];

        // 2. Tentar registar novamente
        $response = $this->postJson("/api/register", $payload);

        $response->assertStatus(201);

        // 3. Verificar se o email do user antigo foi alterado na BD
        $this->assertDatabaseHas("users", [
            "id" => $oldUser->id,
            "email" => $oldUser->email . "?deleted_newAccount:" . $oldUser->id,
        ]);

        // 4. Verificar se o novo user foi criado limpo
        $this->assertDatabaseHas("users", [
            "name" => "Jogador Reciclado",
            "email" => "recycle@example.com",
            "deleted_at" => null,
        ]);
    }

    /**
     * Teste: Login (POST /api/login)
     */
    public function test_user_can_login()
    {
        User::factory()->create([
            "email" => "login@example.com",
            "password" => Hash::make("password123"),
        ]);

        $response = $this->postJson("/api/login", [
            "email" => "login@example.com",
            "password" => "password123",
        ]);

        $response->assertStatus(200)->assertJsonStructure(["token"]);
    }

    /**
     * Teste: Login com credenciais erradas
     */
    public function test_user_cannot_login_with_invalid_credentials()
    {
        User::factory()->create([
            "email" => "teste@example.com",
            "password" => Hash::make("certa"),
        ]);

        $response = $this->postJson("/api/login", [
            "email" => "teste@example.com",
            "password" => "errada",
        ]);

        $response
            ->assertStatus(422) // ValidationException do Laravel retorna 422
            ->assertJsonValidationErrors(["email"]);
    }

    /**
     * Teste: Logout (POST /api/logout)
     */
    public function test_user_can_logout()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user); // Autentica para o teste

        $response = $this->postJson("/api/logout");

        $response
            ->assertStatus(200)
            ->assertJson(["message" => "Logged out successfully"]);
    }

    /**
     * Teste: Update Profile (PATCH /api/users/me)
     */
    public function test_user_can_update_profile()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            "name" => "Nome Alterado",
            "nickname" => "novo_nick",
        ];

        $response = $this->patchJson("/api/users/me", $payload);

        $response->assertJson([
            "data" => [
                // <--- AQUI: Resources usam "data" por defeito
                "name" => "Nome Alterado",
                "nickname" => "novo_nick",
            ],
        ]);

        $this->assertDatabaseHas("users", [
            "id" => $user->id,
            "name" => "Nome Alterado",
            "nickname" => "novo_nick",
        ]);
    }

    /**
     * Teste: Update Password no Profile
     */
    // Remove o ": JsonResponse" da assinatura da função
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            // ... as tuas validações ...
            "name" => ["sometimes", "required", "string", "max:255"],
            "email" => [
                "sometimes",
                "required",
                "string",
                "email",
                "max:255",
                Rule::unique("users")->ignore($user->id),
            ],
            "nickname" => [
                "sometimes",
                "nullable",
                "string",
                "max:20",
                Rule::unique("users")->ignore($user->id),
            ],
            "password" => ["sometimes", "nullable", "string", "min:3"],
            "photo_avatar_filename" => ["sometimes", "nullable", "string"],
        ]);

        if (
            array_key_exists("password", $data) &&
            $data["password"] !== null &&
            $data["password"] !== ""
        ) {
            $data["password"] = Hash::make($data["password"]);
        } else {
            unset($data["password"]);
        }

        $user->update($data);

        // O erro dava-se porque isto é um Resource, não um JsonResponse estrito
        return new UserResource($user);
    }

    /**
     * Teste: Apagar Conta (PATCH /api/users/me/deactivate)
     * Nota: A tua rota usa PATCH para 'deactivate', não DELETE.
     */
    public function test_user_can_delete_account()
    {
        $password = "senha_para_apagar";
        $user = User::factory()->create([
            "password" => Hash::make($password),
            "type" => "P", // Player normal (assumindo que 'A' é admin)
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson("/api/users/me/deactivate", [
            "current_password" => $password,
        ]);

        $response
            ->assertStatus(200)
            ->assertJson(["message" => "Account deleted successfully."]);

        // Verifica se a coluna deleted_at foi preenchida (Soft Delete)
        $this->assertSoftDeleted("users", ["id" => $user->id]);
    }

    /**
     * Teste: Tentar apagar conta com senha errada
     */
    public function test_user_cannot_delete_account_with_wrong_password()
    {
        $user = User::factory()->create([
            "password" => Hash::make("senha_real"),
        ]);
        Sanctum::actingAs($user);

        $response = $this->patchJson("/api/users/me/deactivate", [
            "current_password" => "senha_incorreta",
        ]);

        $response
            ->assertStatus(422)
            ->assertJson(["message" => "Current password is incorrect."]);

        // Garante que o user AINDA existe (não foi apagado)
        $this->assertNotSoftDeleted("users", ["id" => $user->id]);
    }

    /**
     * Teste: Admin não pode apagar a própria conta
     */
    public function test_admin_cannot_delete_own_account()
    {
        $password = "admin_pass";
        $admin = User::factory()->create([
            "password" => Hash::make($password),
            "type" => "A", // Tipo Admin
        ]);
        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/users/me/deactivate", [
            "current_password" => $password,
        ]);

        $response
            ->assertStatus(403) // Forbidden
            ->assertJson([
                "message" => "Administrators cannot delete their own accounts.",
            ]);

        $this->assertNotSoftDeleted("users", ["id" => $admin->id]);
    }
}
