<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Фактически использованные ингредиенты
        Schema::create('production_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->foreignId('warehouse_id')->constrained()->onDelete('restrict'); // Откуда списываем
            $table->decimal('planned_quantity', 15, 4); // Плановое количество (из рецепта * batch_count)
            $table->decimal('actual_quantity', 15, 4); // Фактическое количество
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_ingredients');
    }
};
