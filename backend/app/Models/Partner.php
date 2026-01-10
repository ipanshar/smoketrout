<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    protected $fillable = [
        'name',
        'code',
        'share_percentage',
        'phone',
        'email',
        'description',
        'is_active',
    ];

    protected $casts = [
        'share_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
