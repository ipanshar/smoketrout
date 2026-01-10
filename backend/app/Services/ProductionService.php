<?php

namespace App\Services;

use App\Models\Production;
use App\Models\ProductionIngredient;
use App\Models\ProductionOutput;
use App\Models\Recipe;
use App\Models\StockBalance;
use Illuminate\Support\Facades\DB;

class ProductionService
{
    /**
     * Создать производство из рецепта
     */
    public function create(array $data): Production
    {
        return DB::transaction(function () use ($data) {
            $recipe = Recipe::with(['ingredients.product', 'outputs.product'])->findOrFail($data['recipe_id']);
            $batchCount = $data['batch_count'] ?? 1;

            $production = Production::create([
                'number' => Production::generateNumber(),
                'date' => $data['date'] ?? now(),
                'recipe_id' => $data['recipe_id'],
                'user_id' => $data['user_id'],
                'output_warehouse_id' => $data['output_warehouse_id'],
                'batch_count' => $batchCount,
                'notes' => $data['notes'] ?? null,
                'status' => Production::STATUS_DRAFT,
            ]);

            // Создаём ингредиенты (если переданы кастомные - используем их)
            if (!empty($data['ingredients'])) {
                foreach ($data['ingredients'] as $ing) {
                    ProductionIngredient::create([
                        'production_id' => $production->id,
                        'product_id' => $ing['product_id'],
                        'warehouse_id' => $ing['warehouse_id'],
                        'planned_quantity' => $ing['planned_quantity'],
                        'actual_quantity' => $ing['actual_quantity'] ?? $ing['planned_quantity'],
                    ]);
                }
            } else {
                // Из рецепта
                foreach ($recipe->ingredients as $ing) {
                    ProductionIngredient::create([
                        'production_id' => $production->id,
                        'product_id' => $ing->product_id,
                        'warehouse_id' => $data['ingredient_warehouse_id'] ?? $data['output_warehouse_id'],
                        'planned_quantity' => $ing->quantity * $batchCount,
                        'actual_quantity' => $ing->quantity * $batchCount,
                    ]);
                }
            }

            // Создаём выходы (если переданы кастомные - используем их)
            if (!empty($data['outputs'])) {
                foreach ($data['outputs'] as $out) {
                    ProductionOutput::create([
                        'production_id' => $production->id,
                        'product_id' => $out['product_id'],
                        'planned_quantity' => $out['planned_quantity'],
                        'actual_quantity' => $out['actual_quantity'] ?? $out['planned_quantity'],
                        'cost' => 0,
                    ]);
                }
            } else {
                // Из рецепта
                foreach ($recipe->outputs as $out) {
                    ProductionOutput::create([
                        'production_id' => $production->id,
                        'product_id' => $out->product_id,
                        'planned_quantity' => $out->quantity * $batchCount,
                        'actual_quantity' => $out->quantity * $batchCount,
                        'cost' => 0,
                    ]);
                }
            }

            return $production->load(['recipe', 'user', 'outputWarehouse', 'ingredients.product', 'ingredients.warehouse', 'outputs.product']);
        });
    }

    /**
     * Обновить производство (только черновик)
     */
    public function update(Production $production, array $data): Production
    {
        if ($production->status !== Production::STATUS_DRAFT) {
            throw new \Exception('Можно редактировать только черновик');
        }

        return DB::transaction(function () use ($production, $data) {
            $production->update([
                'date' => $data['date'] ?? $production->date,
                'recipe_id' => $data['recipe_id'] ?? $production->recipe_id,
                'output_warehouse_id' => $data['output_warehouse_id'] ?? $production->output_warehouse_id,
                'batch_count' => $data['batch_count'] ?? $production->batch_count,
                'notes' => $data['notes'] ?? $production->notes,
            ]);

            // Обновляем ингредиенты
            if (isset($data['ingredients'])) {
                $production->ingredients()->delete();
                foreach ($data['ingredients'] as $ing) {
                    ProductionIngredient::create([
                        'production_id' => $production->id,
                        'product_id' => $ing['product_id'],
                        'warehouse_id' => $ing['warehouse_id'],
                        'planned_quantity' => $ing['planned_quantity'],
                        'actual_quantity' => $ing['actual_quantity'] ?? $ing['planned_quantity'],
                    ]);
                }
            }

            // Обновляем выходы
            if (isset($data['outputs'])) {
                $production->outputs()->delete();
                foreach ($data['outputs'] as $out) {
                    ProductionOutput::create([
                        'production_id' => $production->id,
                        'product_id' => $out['product_id'],
                        'planned_quantity' => $out['planned_quantity'],
                        'actual_quantity' => $out['actual_quantity'] ?? $out['planned_quantity'],
                        'cost' => 0,
                    ]);
                }
            }

            return $production->fresh(['recipe', 'user', 'outputWarehouse', 'ingredients.product', 'ingredients.warehouse', 'outputs.product']);
        });
    }

    /**
     * Провести производство - списать ингредиенты, добавить готовую продукцию
     */
    public function confirm(Production $production): Production
    {
        if ($production->status !== Production::STATUS_DRAFT) {
            throw new \Exception('Можно провести только черновик');
        }

        return DB::transaction(function () use ($production) {
            $production->load(['ingredients.product', 'outputs.product']);

            // Рассчитываем общую себестоимость ингредиентов
            $totalIngredientCost = 0;

            // Списываем ингредиенты со складов
            foreach ($production->ingredients as $ingredient) {
                $stockBalance = StockBalance::where('warehouse_id', $ingredient->warehouse_id)
                    ->where('product_id', $ingredient->product_id)
                    ->first();

                if (!$stockBalance || $stockBalance->quantity < $ingredient->actual_quantity) {
                    throw new \Exception("Недостаточно товара '{$ingredient->product->name}' на складе");
                }

                // Добавляем к себестоимости
                $ingredientCost = $ingredient->actual_quantity * $stockBalance->avg_cost;
                $totalIngredientCost += $ingredientCost;

                // Списываем
                $stockBalance->quantity -= $ingredient->actual_quantity;
                $stockBalance->save();

                if ($stockBalance->quantity == 0) {
                    $stockBalance->delete();
                }
            }

            // Рассчитываем себестоимость на единицу готовой продукции
            $totalOutputQuantity = $production->outputs->sum('actual_quantity');
            $costPerUnit = $totalOutputQuantity > 0 ? $totalIngredientCost / $totalOutputQuantity : 0;

            // Добавляем готовую продукцию на склад
            foreach ($production->outputs as $output) {
                $output->cost = $costPerUnit;
                $output->save();

                $stockBalance = StockBalance::firstOrNew([
                    'warehouse_id' => $production->output_warehouse_id,
                    'product_id' => $output->product_id,
                ]);

                // Пересчитываем среднюю себестоимость
                $oldTotal = $stockBalance->quantity * $stockBalance->avg_cost;
                $newTotal = $output->actual_quantity * $costPerUnit;
                $newQuantity = $stockBalance->quantity + $output->actual_quantity;
                
                $stockBalance->avg_cost = $newQuantity > 0 ? ($oldTotal + $newTotal) / $newQuantity : 0;
                $stockBalance->quantity = $newQuantity;
                $stockBalance->save();
            }

            $production->status = Production::STATUS_CONFIRMED;
            $production->save();

            return $production->fresh(['recipe', 'user', 'outputWarehouse', 'ingredients.product', 'ingredients.warehouse', 'outputs.product']);
        });
    }

    /**
     * Отменить производство - вернуть ингредиенты, списать готовую продукцию
     */
    public function cancel(Production $production): Production
    {
        if ($production->status !== Production::STATUS_CONFIRMED) {
            throw new \Exception('Можно отменить только проведённое производство');
        }

        return DB::transaction(function () use ($production) {
            $production->load(['ingredients', 'outputs']);

            // Возвращаем ингредиенты на склады
            foreach ($production->ingredients as $ingredient) {
                $stockBalance = StockBalance::firstOrNew([
                    'warehouse_id' => $ingredient->warehouse_id,
                    'product_id' => $ingredient->product_id,
                ]);

                $stockBalance->quantity += $ingredient->actual_quantity;
                $stockBalance->save();
            }

            // Списываем готовую продукцию со склада
            foreach ($production->outputs as $output) {
                $stockBalance = StockBalance::where('warehouse_id', $production->output_warehouse_id)
                    ->where('product_id', $output->product_id)
                    ->first();

                if ($stockBalance) {
                    $stockBalance->quantity -= $output->actual_quantity;
                    if ($stockBalance->quantity <= 0) {
                        $stockBalance->delete();
                    } else {
                        $stockBalance->save();
                    }
                }
            }

            $production->status = Production::STATUS_CANCELLED;
            $production->save();

            return $production->fresh(['recipe', 'user', 'outputWarehouse', 'ingredients.product', 'ingredients.warehouse', 'outputs.product']);
        });
    }

    /**
     * Удалить производство (только черновик)
     */
    public function delete(Production $production): bool
    {
        if ($production->status !== Production::STATUS_DRAFT) {
            throw new \Exception('Можно удалить только черновик');
        }

        return $production->delete();
    }
}
