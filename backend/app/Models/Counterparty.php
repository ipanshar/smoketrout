<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Counterparty extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'inn',
        'kpp',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function types(): BelongsToMany
    {
        return $this->belongsToMany(CounterpartyType::class, 'counterparty_counterparty_type')
            ->withTimestamps();
    }
}
