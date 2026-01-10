<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        $query = CashRegister::with('currency');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
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
            'code' => 'required|string|max:50|unique:cash_registers',
            'type' => 'required|in:cash,bank,online',
            'currency_id' => 'required|exists:currencies,id',
            'balance' => 'numeric',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $cashRegister = CashRegister::create($validated);
        $cashRegister->load('currency');

        return response()->json($cashRegister, 201);
    }

    public function show(CashRegister $cashRegister)
    {
        $cashRegister->load('currency');
        return response()->json($cashRegister);
    }

    public function update(Request $request, CashRegister $cashRegister)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:cash_registers,code,' . $cashRegister->id,
            'type' => 'required|in:cash,bank,online',
            'currency_id' => 'required|exists:currencies,id',
            'balance' => 'numeric',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $cashRegister->update($validated);
        $cashRegister->load('currency');

        return response()->json($cashRegister);
    }

    public function destroy(CashRegister $cashRegister)
    {
        $cashRegister->delete();
        return response()->json(['message' => 'Удалено']);
    }

    public function types()
    {
        return response()->json(CashRegister::TYPES);
    }
}
