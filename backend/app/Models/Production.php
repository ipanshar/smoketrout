<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Production extends Model
{
    protected $fillable = [
        'number',
        'date',
        'recipe_id',
        'user_id',
        'output_warehouse_id',
        'batch_count',
        'notes',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'batch_count' => 'decimal:4',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outputWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'output_warehouse_id');
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(ProductionIngredient::class);
    }

    public function outputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }

    /**
     * Генерация номера производства
     */
    public static function generateNumber(): string
    {
        $year = date('y');
        $lastProduction = self::whereYear('created_at', date('Y'))
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastProduction ? ((int) substr($lastProduction->number ?? '0000', -4)) + 1 : 1;
        
        return sprintf('ПРЗ-%s-%04d', $year, $number);
    }

    public static function getStatusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_DRAFT => 'Черновик',
            self::STATUS_CONFIRMED => 'Проведён',
            self::STATUS_CANCELLED => 'Отменён',
            default => $status,
        };
    }
}
