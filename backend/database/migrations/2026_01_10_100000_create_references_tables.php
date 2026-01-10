<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Единицы измерения
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name');           // Килограмм, Литр, Штука
            $table->string('short_name');     // кг, л, шт
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Типы контрагентов
        Schema::create('counterparty_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');           // Поставщик, Покупатель, Сотрудник
            $table->string('code')->unique(); // supplier, customer, employee
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Контрагенты
        Schema::create('counterparties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_id')->constrained('counterparty_types')->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('inn')->nullable();          // ИНН
            $table->string('kpp')->nullable();          // КПП
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Склады
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();           // main, production, storage
            $table->text('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Кассы
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();           // main, bank, petty
            $table->enum('type', ['cash', 'bank', 'online'])->default('cash');
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('currency', 3)->default('RUB');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Типы товаров
        Schema::create('product_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');                     // Сырьё, Готовая продукция, Упаковка
            $table->string('code')->unique();           // raw, finished, packaging
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Товары
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_id')->constrained('product_types')->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('units')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique()->nullable(); // Артикул
            $table->string('barcode')->nullable();
            $table->text('description')->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('cost', 15, 2)->default(0);  // Себестоимость
            $table->decimal('min_stock', 15, 3)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_types');
        Schema::dropIfExists('cash_registers');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('counterparties');
        Schema::dropIfExists('counterparty_types');
        Schema::dropIfExists('units');
    }
};
