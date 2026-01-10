<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function outputs(): HasMany
    {
        return $this->hasMany(RecipeOutput::class);
    }

    public function productions(): HasMany
    {
        return $this->hasMany(Production::class);
    }

    /**
     * Генерация кода рецепта
     */
    public static function generateCode(): string
    {
        $year = date('y');
        $lastRecipe = self::whereYear('created_at', date('Y'))
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastRecipe ? ((int) substr($lastRecipe->code ?? '0000', -4)) + 1 : 1;
        
        return sprintf('РЦ-%s-%04d', $year, $number);
    }
}
