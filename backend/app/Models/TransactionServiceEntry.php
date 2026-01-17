<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionServiceEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'service_id',
        'quantity',
        'price',
        'amount',
        'note',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'price' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    /**
     * Транзакция
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Услуга
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
