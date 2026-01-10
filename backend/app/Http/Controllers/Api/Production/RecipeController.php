<?php

namespace App\Http\Controllers\Api\Production;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\RecipeOutput;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::with(['ingredients.product.unit', 'outputs.product.unit']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $recipes = $request->has('per_page')
            ? $query->orderBy('name')->paginate($request->per_page)
            : $query->orderBy('name')->get();

        return response()->json($recipes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:recipes',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.0001',
            'outputs' => 'required|array|min:1',
            'outputs.*.product_id' => 'required|exists:products,id',
            'outputs.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        $recipe = DB::transaction(function () use ($validated) {
            $recipe = Recipe::create([
                'name' => $validated['name'],
                'code' => $validated['code'] ?? Recipe::generateCode(),
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['ingredients'] as $ing) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'product_id' => $ing['product_id'],
                    'quantity' => $ing['quantity'],
                ]);
            }

            foreach ($validated['outputs'] as $out) {
                RecipeOutput::create([
                    'recipe_id' => $recipe->id,
                    'product_id' => $out['product_id'],
                    'quantity' => $out['quantity'],
                ]);
            }

            return $recipe->load(['ingredients.product.unit', 'outputs.product.unit']);
        });

        return response()->json($recipe, 201);
    }

    public function show(Recipe $recipe): JsonResponse
    {
        return response()->json(
            $recipe->load(['ingredients.product.unit', 'outputs.product.unit'])
        );
    }

    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50|unique:recipes,code,' . $recipe->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'ingredients' => 'sometimes|array|min:1',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.0001',
            'outputs' => 'sometimes|array|min:1',
            'outputs.*.product_id' => 'required|exists:products,id',
            'outputs.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        DB::transaction(function () use ($recipe, $validated) {
            $recipe->update([
                'name' => $validated['name'] ?? $recipe->name,
                'code' => $validated['code'] ?? $recipe->code,
                'description' => $validated['description'] ?? $recipe->description,
                'is_active' => $validated['is_active'] ?? $recipe->is_active,
            ]);

            if (isset($validated['ingredients'])) {
                $recipe->ingredients()->delete();
                foreach ($validated['ingredients'] as $ing) {
                    RecipeIngredient::create([
                        'recipe_id' => $recipe->id,
                        'product_id' => $ing['product_id'],
                        'quantity' => $ing['quantity'],
                    ]);
                }
            }

            if (isset($validated['outputs'])) {
                $recipe->outputs()->delete();
                foreach ($validated['outputs'] as $out) {
                    RecipeOutput::create([
                        'recipe_id' => $recipe->id,
                        'product_id' => $out['product_id'],
                        'quantity' => $out['quantity'],
                    ]);
                }
            }
        });

        return response()->json(
            $recipe->fresh(['ingredients.product.unit', 'outputs.product.unit'])
        );
    }

    public function destroy(Recipe $recipe): JsonResponse
    {
        // Проверяем, есть ли производства с этим рецептом
        if ($recipe->productions()->exists()) {
            return response()->json([
                'message' => 'Нельзя удалить рецепт, который используется в производстве'
            ], 422);
        }

        $recipe->delete();

        return response()->json(null, 204);
    }
}
