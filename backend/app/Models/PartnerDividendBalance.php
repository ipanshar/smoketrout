<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerDividendBalance extends Model
{
    protected $fillable = [
        'partner_id',
        'currency_id',
        'total_accrued',
        'total_paid',
        'balance',
    ];

    protected $casts = [
        'total_accrued' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public static function accrue(int $partnerId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['partner_id' => $partnerId, 'currency_id' => $currencyId],
            ['total_accrued' => 0, 'total_paid' => 0, 'balance' => 0]
        );
        
        $balance->total_accrued += $amount;
        $balance->balance += $amount;
        $balance->save();
        
        return $balance;
    }

    public static function pay(int $partnerId, int $currencyId, float $amount): self
    {
        $balance = self::firstOrCreate(
            ['partner_id' => $partnerId, 'currency_id' => $currencyId],
            ['total_accrued' => 0, 'total_paid' => 0, 'balance' => 0]
        );
        
        $balance->total_paid += $amount;
        $balance->balance -= $amount;
        $balance->save();
        
        return $balance;
    }
}
