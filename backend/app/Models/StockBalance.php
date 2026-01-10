<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockBalance extends Model
{
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'quantity',
        'avg_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'avg_cost' => 'decimal:2',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public static function updateBalance(int $warehouseId, int $productId, float $quantity, float $price = 0): self
    {
        $balance = self::firstOrCreate(
            ['warehouse_id' => $warehouseId, 'product_id' => $productId],
            ['quantity' => 0, 'avg_cost' => 0]
        );
        
        // Пересчитываем среднюю себестоимость при приходе
        if ($quantity > 0 && $price > 0) {
            $totalValue = ($balance->quantity * $balance->avg_cost) + ($quantity * $price);
            $totalQty = $balance->quantity + $quantity;
            $balance->avg_cost = $totalQty > 0 ? $totalValue / $totalQty : 0;
        }
        
        $balance->quantity += $quantity;
        $balance->save();
        
        return $balance;
    }
}
