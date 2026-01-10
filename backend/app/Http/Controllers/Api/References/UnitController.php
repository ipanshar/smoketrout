<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_name', 'like', "%{$search}%");
            });
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
            'short_name' => 'required|string|max:50',
            'is_active' => 'boolean',
        ]);

        $unit = Unit::create($validated);

        return response()->json($unit, 201);
    }

    public function show(Unit $unit)
    {
        return response()->json($unit);
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
            'is_active' => 'boolean',
        ]);

        $unit->update($validated);

        return response()->json($unit);
    }

    public function destroy(Unit $unit)
    {
        if ($unit->products()->exists()) {
            return response()->json([
                'message' => 'Невозможно удалить: есть связанные товары',
            ], 422);
        }

        $unit->delete();

        return response()->json(['message' => 'Удалено']);
    }
}
