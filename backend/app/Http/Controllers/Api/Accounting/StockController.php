<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\StockBalance;
use App\Models\TransactionItem;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    /**
     * Остатки на складах
     */
    public function balances(Request $request): JsonResponse
    {
        $query = StockBalance::with(['warehouse', 'product.unit'])
            ->where('quantity', '!=', 0);

        // Фильтр по складу
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Фильтр по товару
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Группировка
        $groupBy = $request->get('group_by', 'warehouse'); // warehouse, product

        $balances = $query->get();

        if ($groupBy === 'warehouse') {
            $result = $balances->groupBy('warehouse_id')->map(function ($items) {
                $warehouse = $items->first()->warehouse;
                return [
                    'warehouse' => $warehouse,
                    'items' => $items->map(fn($item) => [
                        'product' => $item->product,
                        'quantity' => $item->quantity,
                        'avg_cost' => $item->avg_cost,
                        'total_value' => $item->quantity * $item->avg_cost,
                    ]),
                    'total_value' => $items->sum(fn($i) => $i->quantity * $i->avg_cost),
                ];
            })->values();
        } else {
            $result = $balances->groupBy('product_id')->map(function ($items) {
                $product = $items->first()->product;
                return [
                    'product' => $product,
                    'warehouses' => $items->map(fn($item) => [
                        'warehouse' => $item->warehouse,
                        'quantity' => $item->quantity,
                        'avg_cost' => $item->avg_cost,
                    ]),
                    'total_quantity' => $items->sum('quantity'),
                ];
            })->values();
        }

        return response()->json($result);
    }

    /**
     * Движения по складу
     */
    public function movements(Request $request): JsonResponse
    {
        $query = TransactionItem::with([
            'transaction' => function ($q) {
                $q->with(['counterparty', 'user']);
            },
            'product.unit',
            'warehouse',
            'warehouseTo',
        ])
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->orderBy('created_at', 'desc');

        // Фильтр по складу
        if ($request->filled('warehouse_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('warehouse_id', $request->warehouse_id)
                    ->orWhere('warehouse_to_id', $request->warehouse_id);
            });
        }

        // Фильтр по товару
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Фильтр по дате
        if ($request->filled('date_from')) {
            $query->whereHas('transaction', function ($q) use ($request) {
                $q->whereDate('date', '>=', $request->date_from);
            });
        }
        if ($request->filled('date_to')) {
            $query->whereHas('transaction', function ($q) use ($request) {
                $q->whereDate('date', '<=', $request->date_to);
            });
        }

        $movements = $query->paginate($request->get('per_page', 20));

        return response()->json($movements);
    }

    /**
     * Сводка по складам
     */
    public function summary(): JsonResponse
    {
        $warehouses = Warehouse::where('is_active', true)->get();

        $summary = $warehouses->map(function ($warehouse) {
            $balances = StockBalance::where('warehouse_id', $warehouse->id)
                ->where('quantity', '!=', 0)
                ->with('product')
                ->get();

            return [
                'warehouse' => $warehouse,
                'items_count' => $balances->count(),
                'total_quantity' => $balances->sum('quantity'),
                'total_value' => $balances->sum(fn($b) => $b->quantity * $b->avg_cost),
            ];
        });

        return response()->json($summary);
    }
}
