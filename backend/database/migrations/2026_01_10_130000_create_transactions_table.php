<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', [
                'cash_in',           // Приход денег (не от контрагента)
                'cash_out',          // Расход денег (не контрагенту)
                'sale',              // Продажа товара
                'sale_payment',      // Получение оплаты от покупателя
                'purchase',          // Покупка сырья/товара
                'purchase_payment',  // Оплата поставщику
                'transfer',          // Перемещение между складами
                'dividend_accrual',  // Начисление дивидендов
                'dividend_payment',  // Выплата дивидендов
            ]);
            $table->string('number', 20)->unique(); // Авто-номер: ПР-0001, ПК-0001...
            $table->date('date');
            $table->foreignId('counterparty_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0); // Общая сумма документа
            $table->decimal('paid_amount', 15, 2)->default(0);  // Оплачено сейчас (для sale/purchase)
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])->default('draft');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->index(['type', 'date']);
            $table->index(['counterparty_id', 'date']);
            $table->index(['status', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
