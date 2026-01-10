<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_counterparty_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('counterparty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2); // + нам должны, - мы должны
            $table->timestamps();
            
            $table->index(['counterparty_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_counterparty_entries');
    }
};
