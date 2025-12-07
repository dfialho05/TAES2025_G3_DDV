<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deck;
use Illuminate\Support\Facades\File;

class DeckSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        // Ensure the destination directory exists and is clean
        $destinationPath = storage_path("app/public/decks");
        if (File::exists($destinationPath)) {
            File::deleteDirectory($destinationPath);
        }
        File::makeDirectory($destinationPath, 0755, true);

        // Copy the decks folder to storage
        File::copyDirectory(database_path("seeders/decks"), $destinationPath);

        // 1. Baralho Clássico (Grátis)
        Deck::create([
            "name" => "Clássico",
            "slug" => "default",
            "price" => 0,
            "active" => true,
        ]);

        // 2. Baralho de Fogo
        Deck::create([
            "name" => "Fogo Infernal",
            "slug" => "fire",
            "price" => 1000,
            "active" => true,
        ]);

        // 3. Baralho de Gelo
        Deck::create([
            "name" => "Gelo Ártico",
            "slug" => "ice",
            "price" => 1200,
            "active" => true,
        ]);

        // 4. Baralho Dourado (Premium)
        Deck::create([
            "name" => "Ouro Real",
            "slug" => "gold",
            "price" => 2000,
            "active" => true,
        ]);
    }
}
