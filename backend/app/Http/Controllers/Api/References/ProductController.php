<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['type', 'unit']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('type_id')) {
            $query->where('type_id', $request->type_id);
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
            'type_id' => 'required|exists:product_types,id',
            'unit_id' => 'required|exists:units,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products',
            'barcode' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'cost' => 'numeric|min:0',
            'min_stock' => 'numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $product = Product::create($validated);
        $product->load(['type', 'unit']);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        $product->load(['type', 'unit']);
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type_id' => 'required|exists:product_types,id',
            'unit_id' => 'required|exists:units,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'cost' => 'numeric|min:0',
            'min_stock' => 'numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);
        $product->load(['type', 'unit']);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Удалено']);
    }
}
