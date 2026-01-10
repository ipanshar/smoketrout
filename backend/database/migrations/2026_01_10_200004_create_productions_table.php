<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productions', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique(); // Номер производства ПР-26-0001
            $table->date('date');
            $table->foreignId('recipe_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict'); // Кто произвёл
            $table->foreignId('output_warehouse_id')->constrained('warehouses')->onDelete('restrict'); // Склад для готовой продукции
            $table->decimal('batch_count', 10, 4)->default(1); // Количество партий
            $table->text('notes')->nullable();
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productions');
    }
};
