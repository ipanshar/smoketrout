<?php

namespace App\Http\Controllers\Api\References;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    /**
     * Список услуг
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('currency');

        // Фильтр по активности
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Поиск по названию
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Сортировка
        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $services = $request->boolean('all')
            ? $query->get()
            : $query->paginate($request->get('per_page', 15));

        return response()->json($services);
    }

    /**
     * Создание услуги
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:services,name',
            'description' => 'nullable|string',
            'default_price' => 'nullable|numeric|min:0',
            'currency_id' => 'nullable|exists:currencies,id',
            'is_active' => 'boolean',
        ]);

        $service = Service::create($validated);
        $service->load('currency');

        return response()->json([
            'message' => 'Услуга успешно создана',
            'service' => $service,
        ], 201);
    }

    /**
     * Просмотр услуги
     */
    public function show(Service $service): JsonResponse
    {
        $service->load('currency');

        return response()->json($service);
    }

    /**
     * Обновление услуги
     */
    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('services', 'name')->ignore($service->id)],
            'description' => 'nullable|string',
            'default_price' => 'nullable|numeric|min:0',
            'currency_id' => 'nullable|exists:currencies,id',
            'is_active' => 'boolean',
        ]);

        $service->update($validated);
        $service->load('currency');

        return response()->json([
            'message' => 'Услуга успешно обновлена',
            'service' => $service,
        ]);
    }

    /**
     * Удаление услуги
     */
    public function destroy(Service $service): JsonResponse
    {
        // Проверяем использование в транзакциях
        if ($service->transactionEntries()->exists()) {
            return response()->json([
                'message' => 'Невозможно удалить услугу, так как она используется в транзакциях',
            ], 422);
        }

        $service->delete();

        return response()->json([
            'message' => 'Услуга успешно удалена',
        ]);
    }

    /**
     * Переключение активности услуги
     */
    public function toggleActive(Service $service): JsonResponse
    {
        $service->update(['is_active' => !$service->is_active]);

        return response()->json([
            'message' => $service->is_active ? 'Услуга активирована' : 'Услуга деактивирована',
            'service' => $service,
        ]);
    }
}
