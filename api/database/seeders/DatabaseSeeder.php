<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Seeding database...');
        $this->command->newLine();

        // Create default users
        $this->command->info('Creating default users...');

        $example = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $user1 = User::factory()->create([
            'name' => 'DAD User 1',
            'email' => 'dad_user1@example.com',
        ]);

        $user2 = User::factory()->create([
            'name' => 'DAD User 2',
            'email' => 'dad_user2@example.com',
        ]);

        $admin = User::factory()->admin()->create([
            'name' => 'DAD Admin',
            'email' => 'dad_admin@example.com',
        ]);

        $this->command->line("  Created user - example: {$example->email}");
        $this->command->line("  Created user - player 1: {$user1->email}");
        $this->command->line("  Created user - player 2: {$user2->email}");
        $this->command->line("  Created admin: {$admin->email}");
        $this->command->newLine();

        $this->command->info('Creating regular users...');
        $userCount = 40;
        User::factory()->count($userCount)->create();
        $this->command->line("  Created {$userCount} regular users");
        $this->command->line('  Total users: '.User::count());
        $this->command->newLine();

        $this->command->info('Creating games...');

        $gameCount = 500;
        Game::factory()->count($gameCount)->create();
        $this->command->line("  Created {$gameCount} random games");

        // Examples of specific game type creation
        Game::factory()
            ->singleplayer()
            ->count(10)
            ->create();

        Game::factory()
            ->multiplayer()
            ->count(10)
            ->create();

        // Examples of specific game status creation
        Game::factory()->pending()->create();
        Game::factory()->playing()->create();
        Game::factory()->interrupted()->create();
        Game::factory()->ended()->create();

        // Show breakdown by type
        $singleplayerCount = Game::where('type', 'S')->count();
        $multiplayerCount = Game::where('type', 'M')->count();
        $this->command->line("      Singleplayer: {$singleplayerCount}");
        $this->command->line("      Multiplayer: {$multiplayerCount}");

        // Show breakdown by status
        $pendingCount = Game::where('status', 'PE')->count();
        $playingCount = Game::where('status', 'PL')->count();
        $endedCount = Game::where('status', 'E')->count();
        $interruptedCount = Game::where('status', 'I')->count();

        $this->command->line("      Pending: {$pendingCount}");
        $this->command->line("      Playing: {$playingCount}");
        $this->command->line("      Ended: {$endedCount}");
        $this->command->line("      Interrupted: {$interruptedCount}");

        $this->command->newLine();
        $this->command->info('Database seeded successfully!');
    }
}
