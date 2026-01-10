<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_dividend_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['accrual', 'payment']); // начисление / выплата
            $table->decimal('amount', 15, 2);
            $table->timestamps();
            
            $table->index(['partner_id', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_dividend_entries');
    }
};
