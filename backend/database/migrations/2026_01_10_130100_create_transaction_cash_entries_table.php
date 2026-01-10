<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_cash_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_register_id')->constrained()->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2); // + приход, - расход
            $table->timestamps();
            
            $table->index(['cash_register_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_cash_entries');
    }
};
