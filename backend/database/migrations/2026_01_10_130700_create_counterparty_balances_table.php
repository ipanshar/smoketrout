<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Балансы контрагентов (+ нам должны, - мы должны)
        Schema::create('counterparty_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counterparty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 15, 2)->default(0); // + нам должны, - мы должны
            $table->timestamps();
            
            $table->unique(['counterparty_id', 'currency_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counterparty_balances');
    }
};
