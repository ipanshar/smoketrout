<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Выход готовой продукции из рецепта
        Schema::create('recipe_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 15, 4); // Количество выхода на одну партию
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_outputs');
    }
};
