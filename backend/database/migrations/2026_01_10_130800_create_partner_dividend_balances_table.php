<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Дивиденды компаньонов
        Schema::create('partner_dividend_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->decimal('total_accrued', 15, 2)->default(0);  // Начислено всего
            $table->decimal('total_paid', 15, 2)->default(0);     // Выплачено всего
            $table->decimal('balance', 15, 2)->default(0);        // К выплате (accrued - paid)
            $table->timestamps();
            
            $table->unique(['partner_id', 'currency_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_dividend_balances');
    }
};
