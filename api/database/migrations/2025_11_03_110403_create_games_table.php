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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            // Player 1 - User who created the game
            // null -> guest user game
            $table->unsignedBigInteger('player1_id')->nullable();
            $table->foreign('player1_id')->references('id')->on('users');
            // 2nd Player
            $table->unsignedBigInteger('player2_id')->nullable();
            $table->foreign('player2_id')->references('id')->on('users');
            // User who won the game
            $table->unsignedBigInteger('winner_id')->nullable();
            $table->foreign('winner_id')->references('id')->on('users');
            // Type of the game
            // S - Single Player
            // M - Multiplayer
            $table->enum('type', ['S', 'M']);
            // Game status
            // PE - PEnding - Game is waiting for players
            // PL - PLaying - Game is in progress
            // E - Ended - Game is over
            // I - Interrupted - Game is interrupted (not finished; no winner)
            $table->enum('status', ['PE', 'PL', 'E', 'I']);

            // Moment when the game began (first click to discover the first tile)
            $table->dateTime('began_at')->nullable();
            // Moment when the game ended (last click that discovered the last tile)
            $table->dateTime('ended_at')->nullable();
            // Game total time (in seconds) = ended_at - began_at
            $table->decimal('total_time', 8, 2)->default(0);
            // Total number of moves by Player 1
            $table->integer('player1_moves')->default(0);
            // Total number of moves by Player 2
            $table->integer('player2_moves')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
