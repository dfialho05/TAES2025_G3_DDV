<?php

namespace App\Http\Controllers;

use App\Models\Deck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

class DeckController extends Controller
{
    /**
     * Retorna todas as informações dos decks disponíveis
     */
    public function index(): JsonResponse
    {
        return response()->json([
            "data" => Deck::where("active", true)->get(),
        ]);
    }

    /**
     * Serve uma imagem específica de uma carta de um deck
     * CORRIGIDO: Gere corretamente o Cache-Control para evitar imagens "presas"
     */
    public function getCardImage(string $deckSlug, string $cardName)
    {
        // 1. Verificar se o deck existe na BD
        $deck = Deck::where("slug", $deckSlug)->where("active", true)->first();

        if (!$deck) {
            return response()->json(["error" => "Deck not found"], 404);
        }

        // 2. Definir caminhos
        $originalPath = storage_path("app/public/decks/{$deckSlug}/{$cardName}");
        $defaultPath = storage_path("app/public/decks/default/{$cardName}");
        
        $finalPath = null;
        $isFallback = false;

        // 3. Lógica de Seleção de Arquivo
        if (File::exists($originalPath)) {
            // Cenário Ideal: A imagem existe no deck pedido
            $finalPath = $originalPath;
        } elseif ($deckSlug !== "default" && File::exists($defaultPath)) {
            // Cenário Fallback: Não existe no deck, usamos a do default
            $finalPath = $defaultPath;
            $isFallback = true; // Marca como fallback para não fazer cache
        } else {
            // Cenário de Erro: Não existe em lado nenhum
            return response()->json(["error" => "Image not found"], 404);
        }

        // 4. Validar se é uma imagem
        $mimeType = File::mimeType($finalPath);
        if (!str_starts_with($mimeType, "image/")) {
            return response()->json(["error" => "Invalid image file"], 400);
        }

        // 5. Preparar a resposta com os Headers corretos
        $fileContent = File::get($finalPath);
        $response = response($fileContent, 200);
        $response->header("Content-Type", $mimeType);

        // 6. GESTÃO DE CACHE (A Correção do Problema da Shop)
        if ($isFallback) {
            // Se estamos a servir uma imagem de substituição (default),
            // OBRIGAMOS o browser a não guardar em cache.
            // Assim, quando fizeres upload da imagem correta, ela atualiza logo.
            $response->header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            $response->header("Pragma", "no-cache");
        } else {
            // Se é a imagem correta, pode fazer cache por 1 ano para ser rápido
            $response->header("Cache-Control", "public, max-age=31536000");
            $response->header("Last-Modified", gmdate("D, d M Y H:i:s", File::lastModified($finalPath)) . " GMT");
        }

        return $response;
    }

    /**
     * Retorna todas as URLs das imagens de um deck
     */
    public function getDeckAssets(string $deckSlug): JsonResponse
    {
        $deck = Deck::where("slug", $deckSlug)->where("active", true)->first();

        if (!$deck) {
            return response()->json(["error" => "Deck not found"], 404);
        }

        $cards = [];
        $deckPath = storage_path("app/public/decks/{$deckSlug}");

        // Lista de arquivos esperados
        $expectedFiles = ["semFace.png", "preview.png"];

        // Adicionar todas as cartas (c1-c13, e1-e13, o1-o13, p1-p13)
        // Excluindo 8, 9, 10
        foreach (["c", "e", "o", "p"] as $suit) {
            for ($i = 1; $i <= 13; $i++) {
                if (in_array($i, [8, 9, 10])) {
                    continue;
                }
                $expectedFiles[] = "{$suit}{$i}.png";
            }
        }

        // Verificar quais arquivos existem e gerar URLs
        foreach ($expectedFiles as $cardFile) {
            $imagePath = "{$deckPath}/{$cardFile}";

            if (File::exists($imagePath)) {
                $cards[$cardFile] = url("/api/decks/{$deckSlug}/image/{$cardFile}");
            } else {
                // Se não existir no deck atual, tentar usar do default
                $defaultPath = storage_path("app/public/decks/default/{$cardFile}");
                if (File::exists($defaultPath)) {
                    // Nota: Apontamos para a URL do default explicitamente aqui
                    $cards[$cardFile] = url("/api/decks/default/image/{$cardFile}");
                }
            }
        }

        return response()->json([
            "deck" => $deck,
            "cards" => $cards,
            "total_assets" => count($cards),
        ]);
    }

    /**
     * Retorna informações detalhadas de um deck específico
     */
    public function show(string $deckSlug): JsonResponse
    {
        $deck = Deck::where("slug", $deckSlug)->where("active", true)->first();

        if (!$deck) {
            return response()->json(["error" => "Deck not found"], 404);
        }

        // Verificar se tem preview
        $previewPath = storage_path("app/public/decks/{$deckSlug}/preview.png");
        $hasPreview = File::exists($previewPath);

        // Se não tiver preview próprio, a URL vai bater no getCardImage
        // que vai tratar do fallback e dos headers de cache corretamente.
        $previewUrl = url("/api/decks/{$deckSlug}/image/preview.png");

        return response()->json([
            "deck" => $deck,
            "preview_url" => $previewUrl,
            "assets_url" => url("/api/decks/{$deckSlug}/assets"),
        ]);
    }

    /**
     * Lista todos os arquivos disponíveis em um deck (para debug/admin)
     */
    public function listDeckFiles(string $deckSlug): JsonResponse
    {
        $deck = Deck::where("slug", $deckSlug)->where("active", true)->first();

        if (!$deck) {
            return response()->json(["error" => "Deck not found"], 404);
        }

        $deckPath = storage_path("app/public/decks/{$deckSlug}");

        if (!is_dir($deckPath)) {
            return response()->json(
                ["error" => "Deck directory not found"],
                404,
            );
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($deckPath),
        );

        foreach ($iterator as $file) {
            if (
                $file->isFile() &&
                in_array($file->getExtension(), ["png", "jpg", "jpeg", "gif"])
            ) {
                $relativePath = str_replace(
                    $deckPath . "/",
                    "",
                    $file->getPathname(),
                );
                $files[] = [
                    "name" => $relativePath,
                    "size" => $file->getSize(),
                    "url" => url(
                        "/api/decks/{$deckSlug}/image/{$relativePath}",
                    ),
                ];
            }
        }

        return response()->json([
            "deck" => $deck,
            "files" => $files,
            "total_files" => count($files),
        ]);
    }
}