<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CounterpartyBalance;
use App\Models\TransactionCounterpartyEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CounterpartyBalanceController extends Controller
{
    /**
     * Балансы контрагентов
     */
    public function balances(Request $request): JsonResponse
    {
        $query = CounterpartyBalance::with(['counterparty.types', 'currency'])
            ->where('balance', '!=', 0);

        // Фильтр по контрагенту
        if ($request->filled('counterparty_id')) {
            $query->where('counterparty_id', $request->counterparty_id);
        }

        // Фильтр: только должники (нам должны)
        if ($request->boolean('debtors_only')) {
            $query->where('balance', '>', 0);
        }

        // Фильтр: только кредиторы (мы должны)
        if ($request->boolean('creditors_only')) {
            $query->where('balance', '<', 0);
        }

        $balances = $query->get()->groupBy('counterparty_id')->map(function ($items) {
            $counterparty = $items->first()->counterparty;
            return [
                'counterparty' => $counterparty,
                'balances' => $items->map(fn($item) => [
                    'currency' => $item->currency,
                    'balance' => $item->balance,
                    'balance_type' => $item->balance > 0 ? 'receivable' : 'payable', // Нам должны / Мы должны
                ]),
                'total_receivable' => $items->where('balance', '>', 0)->sum('balance'),
                'total_payable' => abs($items->where('balance', '<', 0)->sum('balance')),
            ];
        })->values();

        return response()->json($balances);
    }

    /**
     * Движения по контрагенту
     */
    public function movements(Request $request): JsonResponse
    {
        $query = TransactionCounterpartyEntry::with([
            'transaction' => function ($q) {
                $q->with(['user']);
            },
            'counterparty',
            'currency',
        ])
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->orderBy('created_at', 'desc');

        // Фильтр по контрагенту
        if ($request->filled('counterparty_id')) {
            $query->where('counterparty_id', $request->counterparty_id);
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
     * Сводка по взаиморасчётам
     */
    public function summary(): JsonResponse
    {
        $balances = CounterpartyBalance::with(['counterparty', 'currency'])
            ->where('balance', '!=', 0)
            ->get();

        // Группируем по валютам
        $byCurrency = $balances->groupBy('currency_id')->map(function ($items) {
            $currency = $items->first()->currency;
            return [
                'currency' => $currency,
                'total_receivable' => $items->where('balance', '>', 0)->sum('balance'),
                'total_payable' => abs($items->where('balance', '<', 0)->sum('balance')),
            ];
        })->values();

        $summary = [
            'by_currency' => $byCurrency,
            'debtors_count' => $balances->where('balance', '>', 0)->pluck('counterparty_id')->unique()->count(),
            'creditors_count' => $balances->where('balance', '<', 0)->pluck('counterparty_id')->unique()->count(),
            'top_debtors' => $balances->where('balance', '>', 0)
                ->sortByDesc('balance')
                ->take(5)
                ->map(fn($b) => [
                    'counterparty' => $b->counterparty,
                    'currency' => $b->currency,
                    'balance' => $b->balance,
                ])
                ->values(),
            'top_creditors' => $balances->where('balance', '<', 0)
                ->sortBy('balance')
                ->take(5)
                ->map(fn($b) => [
                    'counterparty' => $b->counterparty,
                    'currency' => $b->currency,
                    'balance' => abs($b->balance),
                ])
                ->values(),
        ];

        return response()->json($summary);
    }
}
