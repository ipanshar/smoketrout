<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_to_id')->nullable()->constrained('warehouses')->nullOnDelete(); // Для перемещений
            $table->decimal('quantity', 15, 3); // + приход, - расход
            $table->decimal('price', 15, 2)->default(0); // Цена за единицу
            $table->decimal('amount', 15, 2)->default(0); // Сумма = quantity * price
            $table->timestamps();
            
            $table->index(['warehouse_id', 'product_id']);
            $table->index(['product_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};
