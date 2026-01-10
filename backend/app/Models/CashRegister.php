<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashRegister extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'currency_id',
        'balance',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'balance' => 'decimal:2',
    ];

    public const TYPES = [
        'cash' => 'Наличные',
        'bank' => 'Банк',
        'online' => 'Онлайн',
    ];

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }
}
