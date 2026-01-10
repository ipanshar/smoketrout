<?php

namespace App\Http\Controllers\Api\Production;

use App\Http\Controllers\Controller;
use App\Models\Production;
use App\Services\ProductionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductionController extends Controller
{
    protected ProductionService $productionService;

    public function __construct(ProductionService $productionService)
    {
        $this->productionService = $productionService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Production::with(['recipe', 'user', 'outputWarehouse']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhereHas('recipe', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('recipe_id')) {
            $query->where('recipe_id', $request->recipe_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $productions = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($productions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipe_id' => 'required|exists:recipes,id',
            'date' => 'required|date',
            'output_warehouse_id' => 'required|exists:warehouses,id',
            'batch_count' => 'nullable|numeric|min:0.0001',
            'notes' => 'nullable|string',
            'ingredients' => 'nullable|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.warehouse_id' => 'required|exists:warehouses,id',
            'ingredients.*.planned_quantity' => 'required|numeric|min:0',
            'ingredients.*.actual_quantity' => 'nullable|numeric|min:0',
            'outputs' => 'nullable|array',
            'outputs.*.product_id' => 'required|exists:products,id',
            'outputs.*.planned_quantity' => 'required|numeric|min:0',
            'outputs.*.actual_quantity' => 'nullable|numeric|min:0',
        ]);

        $validated['user_id'] = $request->user()->id;

        try {
            $production = $this->productionService->create($validated);
            return response()->json($production, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Production $production): JsonResponse
    {
        return response()->json(
            $production->load([
                'recipe.ingredients.product.unit',
                'recipe.outputs.product.unit',
                'user',
                'outputWarehouse',
                'ingredients.product.unit',
                'ingredients.warehouse',
                'outputs.product.unit'
            ])
        );
    }

    public function update(Request $request, Production $production): JsonResponse
    {
        $validated = $request->validate([
            'recipe_id' => 'sometimes|exists:recipes,id',
            'date' => 'sometimes|date',
            'output_warehouse_id' => 'sometimes|exists:warehouses,id',
            'batch_count' => 'nullable|numeric|min:0.0001',
            'notes' => 'nullable|string',
            'ingredients' => 'nullable|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.warehouse_id' => 'required|exists:warehouses,id',
            'ingredients.*.planned_quantity' => 'required|numeric|min:0',
            'ingredients.*.actual_quantity' => 'nullable|numeric|min:0',
            'outputs' => 'nullable|array',
            'outputs.*.product_id' => 'required|exists:products,id',
            'outputs.*.planned_quantity' => 'required|numeric|min:0',
            'outputs.*.actual_quantity' => 'nullable|numeric|min:0',
        ]);

        try {
            $production = $this->productionService->update($production, $validated);
            return response()->json($production);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Production $production): JsonResponse
    {
        try {
            $this->productionService->delete($production);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function confirm(Production $production): JsonResponse
    {
        try {
            $production = $this->productionService->confirm($production);
            return response()->json($production);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function cancel(Production $production): JsonResponse
    {
        try {
            $production = $this->productionService->cancel($production);
            return response()->json($production);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Рассчитать ингредиенты и выходы на основе рецепта и количества партий
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipe_id' => 'required|exists:recipes,id',
            'batch_count' => 'required|numeric|min:0.0001',
        ]);

        $recipe = \App\Models\Recipe::with(['ingredients.product.unit', 'outputs.product.unit'])
            ->findOrFail($validated['recipe_id']);

        $batchCount = $validated['batch_count'];

        $ingredients = $recipe->ingredients->map(fn($ing) => [
            'product_id' => $ing->product_id,
            'product' => $ing->product,
            'planned_quantity' => round($ing->quantity * $batchCount, 4),
        ]);

        $outputs = $recipe->outputs->map(fn($out) => [
            'product_id' => $out->product_id,
            'product' => $out->product,
            'planned_quantity' => round($out->quantity * $batchCount, 4),
        ]);

        return response()->json([
            'recipe' => $recipe,
            'batch_count' => $batchCount,
            'ingredients' => $ingredients,
            'outputs' => $outputs,
        ]);
    }
}
