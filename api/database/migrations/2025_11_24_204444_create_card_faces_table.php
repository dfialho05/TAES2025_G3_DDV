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
        Schema::create('card_faces', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('board_theme_id')->nullable();
        $table->foreign('board_theme_id')->references('id')->on('board_themes')->onDelete('cascade');
        $table->string('face_image_url');
        $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_faces');
    }
};
