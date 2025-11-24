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
        // Decide tipo automaticamente para testes
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
            $totalTime = $this->faker->numberBetween(300, 1200); // segundos
            $endedAt = $beganAt->copy()->addSeconds($totalTime);
        }

        // Escolhe jogadores
        $player1 = User::where('role', 'U')->inRandomOrder()->first();
        $player2 = null;

        if ($type === 'M') {
            $player2 = User::where('role', 'U')
                ->where('id', '!=', $player1?->id)
                ->inRandomOrder()
                ->first();
        }

        if (!$player1) {
            throw new \RuntimeException('Não há usuários suficientes. Rode User::factory()->count(10)->create() primeiro.');
        }

        if ($type === 'M' && !$player2) {
            throw new \RuntimeException('Multiplayer precisa de pelo menos 2 usuários.');
        }

        return [
            'type' => $type,
            'status' => $status,
            'player1_id' => $player1->id,
            'player2_id' => $player2?->id, // null para singleplayer ou bot
            'winner_id' => null,
            'began_at' => $beganAt,
            'ended_at' => $endedAt,
            'total_time' => $this->faker->numberBetween(300, 1200),
            'player1_score' => $this->faker->numberBetween(0, 61),
            'player2_score' => $type === 'M' ? $this->faker->numberBetween(0, 61) : 0,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function ($game) {
            if ($game->status === 'E') {
                $winnerId = $game->type === 'S'
                    ? $game->player1_id // Singleplayer: jogador sempre vence ou bot pode ser null
                    : ($game->player1_score >= $game->player2_score ? $game->player1_id : $game->player2_id);

                $game->update(['winner_id' => $winnerId]);
            }
        });
    }

    public function singleplayer(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'S',
            'player2_id' => null,
            'player2_score' => 0,
        ]);
    }

    public function multiplayer(): static
    {
        return $this->state(function(array $attributes) {
            $player1 = User::where('role', 'U')->inRandomOrder()->first();
            $player2 = User::where('role', 'U')->where('id', '!=', $player1?->id)->inRandomOrder()->first();

            if (!$player1 || !$player2) {
                throw new \RuntimeException('Precisa de pelo menos 2 usuários para multiplayer.');
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
        return $this->state(fn(array $attrs) => [
            'status' => 'PE',
            'ended_at' => null,
            'winner_id' => null,
        ]);
    }

    public function playing(): static
    {
        return $this->state(fn(array $attrs) => [
            'status' => 'PL',
            'ended_at' => null,
            'winner_id' => null,
        ]);
    }

    public function ended(): static
    {
        return $this->state(fn(array $attrs) => [
            'status' => 'E',
            'ended_at' => $this->faker->dateTime(),
        ]);
    }
}
