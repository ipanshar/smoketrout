<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CounterpartyBalance extends Model
{
    protected $fillable = [
        'counterparty_id',
        'currency_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function counterparty(): BelongsTo
    {
        return $this->belongsTo(Counterparty::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public static function updateBalance(int $counterpartyId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['counterparty_id' => $counterpartyId, 'currency_id' => $currencyId],
            ['balance' => 0]
        );
        
        $balance->balance += $amount;
        $balance->save();
        
        return $balance;
    }
}
