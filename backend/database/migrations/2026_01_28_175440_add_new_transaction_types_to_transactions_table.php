<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Добавляем новые типы транзакций: writeoff, loan_in, loan_out
     */
    public function up(): void
    {
        // Для MySQL изменяем ENUM
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM(
                'cash_in',
                'cash_out',
                'sale',
                'sale_payment',
                'purchase',
                'purchase_payment',
                'transfer',
                'dividend_accrual',
                'dividend_payment',
                'salary_accrual',
                'salary_payment',
                'writeoff',
                'loan_in',
                'loan_out'
            ) NOT NULL");
        }
        // Для SQLite ничего делать не нужно - тип хранится как TEXT
        // Валидация происходит на уровне модели и контроллера
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ничего не нужно - типы остаются как строки
    }
};
