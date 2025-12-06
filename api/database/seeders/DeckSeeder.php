<?php

namespace Database\Seeders;

use App\Models\Deck;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class DeckSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder now also handles copying and preparing deck assets.
     */
    public function run(): void
    {
        $this->command->info("--- Deck Seeder ---");

        // 1. Copiar e preparar os assets dos decks
        if ($this->copyDeckAssets()) {
            // 2. Popular a tabela de decks no banco de dados
            $this->seedDecksTable();
            $this->command->info("✅ Tabela de decks populada com sucesso!");
        } else {
            $this->command->error(
                "❌ Falha ao copiar os assets. A tabela de decks não foi populada.",
            );
        }

        $this->command->info("--- Deck Seeder Concluído ---");
    }

    /**
     * Copia os assets dos decks do frontend para a pasta de storage da API.
     */
    private function copyDeckAssets(): bool
    {
        $sourceDir = base_path("../frontend/src/assets/cards");
        $destDir = storage_path("app/public/decks");

        $this->command->line("📁 Copiando assets de: $sourceDir");
        $this->command->line("📁 Para: $destDir");

        if (!File::exists($sourceDir)) {
            $this->command->error(
                "Diretório de origem não encontrado. Verifique o caminho.",
            );
            Log::error(
                "[DeckSeeder] Diretório de origem não encontrado: " .
                    $sourceDir,
            );
            return false;
        }

        // Limpa o diretório de destino para garantir um estado limpo
        if (File::exists($destDir)) {
            File::deleteDirectory($destDir);
            $this->command->line("🧹 Diretório de destino limpo.");
        }
        File::makeDirectory($destDir, 0755, true);

        // Copia os arquivos
        $success = File::copyDirectory($sourceDir, $destDir);

        if ($success) {
            $this->command->info("✅ Assets dos decks copiados com sucesso.");
            $this->generateCustomPreviews($destDir);
            return true;
        } else {
            $this->command->error("Falha ao copiar os assets dos decks.");
            Log::error("[DeckSeeder] Falha em File::copyDirectory.");
            return false;
        }
    }

    /**
     * Gera previews customizados para decks específicos usando ImageMagick.
     */
    private function generateCustomPreviews(string $decksPath): void
    {
        $this->command->info("🎨 Gerando previews customizados...");

        if (!command_exists("convert")) {
            $this->command->warn(
                "⚠️  Comando 'convert' (ImageMagick) não encontrado. Previews não foram gerados.",
            );
            return;
        }

        $decksToProcess = [
            "ice" => [
                "input" => "c1.png",
                "command" =>
                    "convert {input} -modulate 100,150,200 -colorspace RGB -fill '#4169e1' -colorize 15% {output}",
            ],
            "gold" => [
                "input" => "c1.png",
                "command" =>
                    "convert {input} -sepia-tone 30% -modulate 110,130,105 -fill '#ffd700' -colorize 20% {output}",
            ],
        ];

        foreach ($decksToProcess as $slug => $details) {
            $deckDir = "$decksPath/$slug";
            $inputFile = "$deckDir/" . $details["input"];
            $outputFile = "$deckDir/preview.png"; // Sobrescreve o preview copiado

            if (File::exists($inputFile)) {
                $command = str_replace(
                    ["{input}", "{output}"],
                    [$inputFile, $outputFile],
                    $details["command"],
                );

                $result = Process::run($command);

                if ($result->successful()) {
                    $this->command->line(
                        "    -> Preview para '$slug' gerado com sucesso.",
                    );
                } else {
                    $this->command->error(
                        "    -> Falha ao gerar preview para '$slug'.",
                    );
                    Log::error(
                        "[DeckSeeder] ImageMagick error for $slug: " .
                            $result->errorOutput(),
                    );
                }
            } else {
                $this->command->warn(
                    "    -> Imagem de base para '$slug' não encontrada. Preview não gerado.",
                );
            }
        }
        $this->command->info("✅ Previews finalizados.");
    }

    /**
     * Popula a tabela 'decks' com os dados padrão.
     */
    private function seedDecksTable(): void
    {
        $decks = [
            [
                "name" => "Clássico",
                "slug" => "default",
                "price" => 0,
                "active" => true,
            ],
            [
                "name" => "Fogo Infernal",
                "slug" => "fire",
                "price" => 1000,
                "active" => true,
            ],
            [
                "name" => "Gelo Ártico",
                "slug" => "ice",
                "price" => 1200,
                "active" => true,
            ],
            [
                "name" => "Ouro Real",
                "slug" => "gold",
                "price" => 2000,
                "active" => true,
            ],
        ];

        foreach ($decks as $deckData) {
            // Usa updateOrCreate para evitar duplicados se o seeder for executado múltiplas vezes
            Deck::updateOrCreate(["slug" => $deckData["slug"]], $deckData);
        }
    }
}

// Helper para verificar se um comando existe no sistema
if (!function_exists("command_exists")) {
    function command_exists(string $command): bool
    {
        $result = shell_exec("command -v $command");
        return !empty($result);
    }
}
