<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Counterparty;
use Illuminate\Http\Request;

class CounterpartyController extends Controller
{
    public function index(Request $request)
    {
        $query = Counterparty::with('types');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('inn', 'like', "%{$search}%");
            });
        }

        if ($request->has('type_id')) {
            $typeId = $request->type_id;
            $query->whereHas('types', function ($q) use ($typeId) {
                $q->where('counterparty_types.id', $typeId);
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
            'type_ids' => 'required|array|min:1',
            'type_ids.*' => 'exists:counterparty_types,id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'inn' => 'nullable|string|max:20',
            'kpp' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $typeIds = $validated['type_ids'];
        unset($validated['type_ids']);

        $counterparty = Counterparty::create($validated);
        $counterparty->types()->sync($typeIds);
        $counterparty->load('types');

        return response()->json($counterparty, 201);
    }

    public function show(Counterparty $counterparty)
    {
        $counterparty->load('types');
        return response()->json($counterparty);
    }

    public function update(Request $request, Counterparty $counterparty)
    {
        $validated = $request->validate([
            'type_ids' => 'required|array|min:1',
            'type_ids.*' => 'exists:counterparty_types,id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'inn' => 'nullable|string|max:20',
            'kpp' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $typeIds = $validated['type_ids'];
        unset($validated['type_ids']);

        $counterparty->update($validated);
        $counterparty->types()->sync($typeIds);
        $counterparty->load('types');

        return response()->json($counterparty);
    }

    public function destroy(Counterparty $counterparty)
    {
        $counterparty->delete();
        return response()->json(['message' => 'Удалено']);
    }
}
