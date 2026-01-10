<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Фактически произведённая продукция
        Schema::create('production_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->decimal('planned_quantity', 15, 4); // Плановое количество (из рецепта * batch_count)
            $table->decimal('actual_quantity', 15, 4); // Фактическое количество
            $table->decimal('cost', 15, 2)->default(0); // Себестоимость единицы
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_outputs');
    }
};
