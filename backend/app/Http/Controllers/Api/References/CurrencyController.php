<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CurrencyController extends Controller
{
    public function index(Request $request)
    {
        $query = Currency::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $currencies = $query->orderBy('name')->get();

        return response()->json(['data' => $currencies]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:3|unique:currencies,code',
            'symbol' => 'nullable|string|max:10',
            'exchange_rate' => 'nullable|numeric|min:0',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Если ставим валюту по умолчанию, снимаем флаг с других
        if (!empty($validated['is_default'])) {
            Currency::where('is_default', true)->update(['is_default' => false]);
        }

        $currency = Currency::create($validated);

        return response()->json($currency, 201);
    }

    public function show(Currency $currency)
    {
        return response()->json($currency);
    }

    public function update(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'size:3', Rule::unique('currencies', 'code')->ignore($currency->id)],
            'symbol' => 'nullable|string|max:10',
            'exchange_rate' => 'nullable|numeric|min:0',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Если ставим валюту по умолчанию, снимаем флаг с других
        if (!empty($validated['is_default']) && !$currency->is_default) {
            Currency::where('is_default', true)->update(['is_default' => false]);
        }

        $currency->update($validated);

        return response()->json($currency);
    }

    public function destroy(Currency $currency)
    {
        if ($currency->is_default) {
            return response()->json(['message' => 'Нельзя удалить валюту по умолчанию'], 422);
        }

        if ($currency->cashRegisters()->exists()) {
            return response()->json(['message' => 'Валюта используется в кассах'], 422);
        }

        $currency->delete();

        return response()->json(null, 204);
    }
}
