<?php

namespace Database\Factories;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Game>
 */
class GameFactory extends Factory
{
    private static ?Carbon $currentDate = null;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['S', 'M']);
        $status = $this->faker->randomElement(['PE', 'PL', 'E', 'I']);

        if (self::$currentDate === null) {
            self::$currentDate = Carbon::now()->subMonths(6);
        } else {
            self::$currentDate->addMinutes($this->faker->numberBetween(10, 120));
        }

        $beganAt = self::$currentDate->copy();
        $endedAt = null;
        if ($status === 'E') {
            $totalTime = $this->faker->numberBetween(30, 200);
            $endedAt = $beganAt->copy()->addSeconds($totalTime);
        }

        $player1 = User::where('role', 'U')->inRandomOrder()->first();
        $player2 = null;

        if ($type === 'M') {
            $player2 = User::where('role', 'U')->inRandomOrder()
                ->where('id', '!=', $player1?->id)
                ->first();
        }

        if (! $player1) {
            throw new \RuntimeException(
                'Cannot create game: no users exist. '.
                'Run User::factory()->count(10)->create() first.'
            );
        }

        if ($type === 'M' && ! $player2) {
            throw new \RuntimeException(
                'Cannot create multiplayer game: only one user exists. '.
                'Need at least 2 users for multiplayer games.'
            );
        }

        return [
            'player1_id' => $player1->id,
            'player2_id' => $player2?->id,
            'winner_id' => null,
            'type' => $type,
            'status' => $status,
            'began_at' => $beganAt,
            'ended_at' => $endedAt,
            'total_time' => $this->faker->numberBetween(6, 36),
            'player1_moves' => $this->faker->numberBetween(6, 36),
            'player2_moves' => $type === 'M' ? $this->faker->numberBetween(6, 36) : 0,
        ];
    }

    // -- Run AfterCreating to ensure consistency with IDs
    public function configure(): static
    {
        return $this->afterCreating(function ($game) {
            // Set winner_id after creation if game is ended
            if ($game->status === 'E') {
                $winnerId = $game->type === 'S'
                    ? $game->player1_id
                    : $this->faker->randomElement([$game->player1_id, $game->player2_id]);

                $game->update(['winner_id' => $winnerId]);
            }
        });
    }

    // Game States
    public function singleplayer(): static
    {
        return $this->state(function (array $attributes) {
            $player1 = User::where('role', 'U')->inRandomOrder()->first();

            if (! $player1) {
                throw new \RuntimeException(
                    'Cannot create game: no users exist. '.
                    'Run User::factory()->count(10)->create() first.'
                );
            }

            return [
                'type' => 'S',
                'player1_id' => $player1->id,
                'player2_id' => null,
                'player2_moves' => 0,
            ];
        });
    }

    public function multiplayer(): static
    {
        return $this->state(function (array $attributes) {
            $player1 = User::where('role', 'U')->inRandomOrder()->first();
            $player2 = User::where('role', 'U')->inRandomOrder()
                ->where('id', '!=', $player1?->id)
                ->first();

            if (! $player1 || ! $player2) {
                throw new \RuntimeException(
                    'Cannot create multiplayer game: need at least 2 users. '.
                    'Run User::factory()->count(10)->create() first.'
                );
            }

            return [
                'type' => 'M',
                'player1_id' => $player1->id,
                'player2_id' => $player2->id,
            ];
        });
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'PE',
            'ended_at' => null,
            'winner_id' => null,
        ]);
    }

    public function playing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'PL',
            'ended_at' => null,
            'winner_id' => null,
        ]);
    }

    public function interrupted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'I',
            'ended_at' => null,
            'winner_id' => null,
        ]);
    }

    public function ended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'E',
            'ended_at' => $this->faker->dateTime(),
        ]);
    }
}
