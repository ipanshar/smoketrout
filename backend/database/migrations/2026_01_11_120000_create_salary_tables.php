<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Балансы зарплаты по сотрудникам
        Schema::create('salary_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('currency_id')->constrained()->onDelete('cascade');
            $table->decimal('accrued', 15, 2)->default(0); // Начислено
            $table->decimal('paid', 15, 2)->default(0); // Выплачено
            $table->timestamps();

            $table->unique(['user_id', 'currency_id']);
        });

        // Записи зарплаты в транзакциях
        Schema::create('transaction_salary_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('currency_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['accrual', 'payment']); // Начисление или выплата
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_salary_entries');
        Schema::dropIfExists('salary_balances');
    }
};
