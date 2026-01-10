<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'currency_id',
        'accrued',
        'paid',
    ];

    protected $casts = [
        'accrued' => 'decimal:2',
        'paid' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Начислить зарплату
     */
    public static function accrue(int $userId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['user_id' => $userId, 'currency_id' => $currencyId],
            ['accrued' => 0, 'paid' => 0]
        );

        $balance->increment('accrued', $amount);

        return $balance;
    }

    /**
     * Выплатить зарплату
     */
    public static function pay(int $userId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['user_id' => $userId, 'currency_id' => $currencyId],
            ['accrued' => 0, 'paid' => 0]
        );

        $balance->increment('paid', $amount);

        return $balance;
    }

    /**
     * Получить баланс (начислено - выплачено)
     */
    public function getBalanceAttribute(): float
    {
        return $this->accrued - $this->paid;
    }
}
