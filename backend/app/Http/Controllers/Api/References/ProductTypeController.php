<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use Illuminate\Http\Request;

class ProductTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductType::withCount('products');

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        return response()->json([
            'data' => $query->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:product_types',
            'is_active' => 'boolean',
        ]);

        $type = ProductType::create($validated);

        return response()->json($type, 201);
    }

    public function show(ProductType $productType)
    {
        return response()->json($productType);
    }

    public function update(Request $request, ProductType $productType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:product_types,code,' . $productType->id,
            'is_active' => 'boolean',
        ]);

        $productType->update($validated);

        return response()->json($productType);
    }

    public function destroy(ProductType $productType)
    {
        if ($productType->products()->exists()) {
            return response()->json([
                'message' => 'Невозможно удалить: есть связанные товары',
            ], 422);
        }

        $productType->delete();

        return response()->json(['message' => 'Удалено']);
    }
}
