<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('decks', function (Blueprint $table) {
            $table->id();
            $table->string('name');         // Ex: "Fogo Infernal"
            $table->string('slug');         // CRUCIAL: Nome da pasta em /src/assets/cards/ (ex: "fire")
            $table->integer('price');       // Preço em Brain Coins
            $table->boolean('active')->default(false); // Para desativar baralhos se necessário
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decks');
    }
};

