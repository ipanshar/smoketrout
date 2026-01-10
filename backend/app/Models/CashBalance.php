<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashBalance extends Model
{
    protected $fillable = [
        'cash_register_id',
        'currency_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public static function updateBalance(int $cashRegisterId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['cash_register_id' => $cashRegisterId, 'currency_id' => $currencyId],
            ['balance' => 0]
        );
        
        $balance->balance += $amount;
        $balance->save();
        
        return $balance;
    }
}
