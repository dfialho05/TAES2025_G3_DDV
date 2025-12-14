<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create trigger to maintain BOT's coin balance at a constant value
        DB::unprepared('
            CREATE TRIGGER maintain_bot_balance
            BEFORE UPDATE ON users
            FOR EACH ROW
            BEGIN
                IF NEW.id = 9999 AND NEW.nickname = "BOT" THEN
                    SET NEW.coins_balance = 999999999999;
                END IF;
            END
        ');

        // Also create an INSERT trigger to ensure BOT starts with correct balance
        DB::unprepared('
            CREATE TRIGGER set_bot_initial_balance
            BEFORE INSERT ON users
            FOR EACH ROW
            BEGIN
                IF NEW.id = 9999 AND NEW.nickname = "BOT" THEN
                    SET NEW.coins_balance = 999999999999;
                END IF;
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS maintain_bot_balance");
        DB::unprepared("DROP TRIGGER IF EXISTS set_bot_initial_balance");
    }
};
