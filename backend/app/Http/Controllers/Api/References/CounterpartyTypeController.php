<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\CounterpartyType;
use Illuminate\Http\Request;

class CounterpartyTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = CounterpartyType::withCount('counterparties');

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
            'code' => 'required|string|max:50|unique:counterparty_types',
            'is_active' => 'boolean',
        ]);

        $type = CounterpartyType::create($validated);

        return response()->json($type, 201);
    }

    public function show(CounterpartyType $counterpartyType)
    {
        return response()->json($counterpartyType);
    }

    public function update(Request $request, CounterpartyType $counterpartyType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:counterparty_types,code,' . $counterpartyType->id,
            'is_active' => 'boolean',
        ]);

        $counterpartyType->update($validated);

        return response()->json($counterpartyType);
    }

    public function destroy(CounterpartyType $counterpartyType)
    {
        if ($counterpartyType->counterparties()->exists()) {
            return response()->json([
                'message' => 'Невозможно удалить: есть связанные контрагенты',
            ], 422);
        }

        $counterpartyType->delete();

        return response()->json(['message' => 'Удалено']);
    }
}
