<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Создаем таблицу валют
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Российский рубль
            $table->string('code', 3)->unique(); // RUB
            $table->string('symbol', 10)->default(''); // ₽
            $table->decimal('exchange_rate', 15, 6)->default(1); // Курс к базовой валюте
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Добавляем базовые валюты
        DB::table('currencies')->insert([
            ['name' => 'Российский рубль', 'code' => 'RUB', 'symbol' => '₽', 'exchange_rate' => 1, 'is_default' => true, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Доллар США', 'code' => 'USD', 'symbol' => '$', 'exchange_rate' => 100, 'is_default' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Евро', 'code' => 'EUR', 'symbol' => '€', 'exchange_rate' => 110, 'is_default' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Добавляем currency_id в cash_registers
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->foreignId('currency_id')->nullable()->after('type')->constrained('currencies')->nullOnDelete();
        });

        // Обновляем существующие кассы - ставим RUB
        $rubId = DB::table('currencies')->where('code', 'RUB')->value('id');
        if ($rubId) {
            DB::table('cash_registers')->whereNull('currency_id')->update(['currency_id' => $rubId]);
        }

        // Удаляем старое поле currency из cash_registers
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn('currency');
        });

        // Создаем pivot таблицу для связи многие-ко-многим контрагент <-> тип
        Schema::create('counterparty_counterparty_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counterparty_id')->constrained('counterparties')->cascadeOnDelete();
            $table->foreignId('counterparty_type_id')->constrained('counterparty_types')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['counterparty_id', 'counterparty_type_id'], 'counterparty_type_unique');
        });

        // Переносим существующие связи из type_id в pivot таблицу
        $counterparties = DB::table('counterparties')->whereNotNull('type_id')->get();
        foreach ($counterparties as $cp) {
            DB::table('counterparty_counterparty_type')->insert([
                'counterparty_id' => $cp->id,
                'counterparty_type_id' => $cp->type_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Удаляем старое поле type_id из counterparties
        Schema::table('counterparties', function (Blueprint $table) {
            $table->dropForeign(['type_id']);
            $table->dropColumn('type_id');
        });
    }

    public function down(): void
    {
        // Восстанавливаем type_id
        Schema::table('counterparties', function (Blueprint $table) {
            $table->foreignId('type_id')->nullable()->after('id')->constrained('counterparty_types')->nullOnDelete();
        });

        Schema::dropIfExists('counterparty_counterparty_type');

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->string('currency', 3)->default('RUB')->after('type');
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropColumn('currency_id');
        });

        Schema::dropIfExists('currencies');
    }
};
