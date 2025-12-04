<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deck;

class DeckSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Baralho Clássico (Pasta 'default')
        Deck::create([
            'name' => 'Clássico',
            'slug' => 'default', // Tem de corresponder à pasta src/assets/cards/default
            'price' => 0,        // Grátis
            'active' => true
        ]);

        // 2. Baralho de Fogo (Pasta 'fire')
        Deck::create([
            'name' => 'Fogo Infernal',
            'slug' => 'fire',    // Tem de corresponder à pasta src/assets/cards/fire
            'price' => 150,      // Preço de exemplo
            'active' => true
        ]);
        
        // Podes adicionar mais aqui futuramente...
    }
}