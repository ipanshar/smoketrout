<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PartnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Partner::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $partners = $query->orderBy('name')->get();

        // Вычисляем общую долю
        $totalShare = Partner::where('is_active', true)->sum('share_percentage');

        return response()->json([
            'data' => $partners,
            'total_share' => $totalShare,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:partners,code',
            'share_percentage' => 'required|numeric|min:0|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Проверяем, что общая доля не превысит 100%
        $currentTotal = Partner::where('is_active', true)->sum('share_percentage');
        $newShare = $validated['share_percentage'];
        
        if ($currentTotal + $newShare > 100) {
            return response()->json([
                'message' => 'Общая доля всех компаньонов не может превышать 100%. Доступно: ' . (100 - $currentTotal) . '%'
            ], 422);
        }

        $partner = Partner::create($validated);

        return response()->json($partner, 201);
    }

    public function show(Partner $partner): JsonResponse
    {
        return response()->json($partner);
    }

    public function update(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:partners,code,' . $partner->id,
            'share_percentage' => 'required|numeric|min:0|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Проверяем, что общая доля не превысит 100% (исключая текущего компаньона)
        $currentTotal = Partner::where('is_active', true)
            ->where('id', '!=', $partner->id)
            ->sum('share_percentage');
        $newShare = $validated['share_percentage'];
        
        if ($validated['is_active'] ?? $partner->is_active) {
            if ($currentTotal + $newShare > 100) {
                return response()->json([
                    'message' => 'Общая доля всех компаньонов не может превышать 100%. Доступно: ' . (100 - $currentTotal) . '%'
                ], 422);
            }
        }

        $partner->update($validated);

        return response()->json($partner);
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();

        return response()->json(null, 204);
    }
}
