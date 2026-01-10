<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CounterpartyType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function counterparties(): BelongsToMany
    {
        return $this->belongsToMany(Counterparty::class, 'counterparty_counterparty_type')
            ->withTimestamps();
    }
}
