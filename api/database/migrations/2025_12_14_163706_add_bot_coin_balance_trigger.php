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
        $driver = DB::connection()->getDriverName();

        if ($driver === "mysql") {
            // MySQL triggers
            DB::unprepared('
                CREATE TRIGGER maintain_bot_balance
                BEFORE UPDATE ON users
                FOR EACH ROW
                BEGIN
                    IF NEW.id = 0 AND NEW.nickname = "BOT" THEN
                        SET NEW.coins_balance = 999999999999;
                    END IF;
                END
            ');

            DB::unprepared('
                CREATE TRIGGER set_bot_initial_balance
                BEFORE INSERT ON users
                FOR EACH ROW
                BEGIN
                    IF NEW.id = 0 AND NEW.nickname = "BOT" THEN
                        SET NEW.coins_balance = 999999999999;
                    END IF;
                END
            ');
        } elseif ($driver === "sqlite") {
            // SQLite triggers
            DB::unprepared('
                CREATE TRIGGER maintain_bot_balance
                BEFORE UPDATE ON users
                FOR EACH ROW
                WHEN NEW.id = 0 AND NEW.nickname = "BOT"
                BEGIN
                    UPDATE users SET coins_balance = 999999999999 WHERE id = NEW.id;
                END
            ');

            DB::unprepared('
                CREATE TRIGGER set_bot_initial_balance
                BEFORE INSERT ON users
                FOR EACH ROW
                WHEN NEW.id = 0 AND NEW.nickname = "BOT"
                BEGIN
                    UPDATE users SET coins_balance = 999999999999 WHERE id = NEW.id;
                END
            ');
        }
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
