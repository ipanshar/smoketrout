<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'type_id',
        'unit_id',
        'name',
        'sku',
        'barcode',
        'description',
        'price',
        'cost',
        'min_stock',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'min_stock' => 'decimal:3',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ProductType::class, 'type_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
