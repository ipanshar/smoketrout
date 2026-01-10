<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CashBalance;
use App\Models\CashRegister;
use App\Models\TransactionCashEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashController extends Controller
{
    /**
     * Остатки по кассам
     */
    public function balances(Request $request): JsonResponse
    {
        $balances = CashBalance::with(['cashRegister', 'currency'])
            ->when($request->filled('cash_register_id'), function ($q) use ($request) {
                $q->where('cash_register_id', $request->cash_register_id);
            })
            ->get()
            ->groupBy('cash_register_id')
            ->map(function ($items) {
                $cashRegister = $items->first()->cashRegister;
                return [
                    'cash_register' => $cashRegister,
                    'balances' => $items->map(function ($item) {
                        return [
                            'currency' => $item->currency,
                            'balance' => $item->balance,
                        ];
                    }),
                ];
            })
            ->values();

        return response()->json($balances);
    }

    /**
     * Движения по кассе
     */
    public function movements(Request $request): JsonResponse
    {
        $query = TransactionCashEntry::with([
            'transaction' => function ($q) {
                $q->with(['counterparty', 'partner', 'user']);
            },
            'cashRegister',
            'currency',
        ])
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->orderBy('created_at', 'desc');

        // Фильтр по кассе
        if ($request->filled('cash_register_id')) {
            $query->where('cash_register_id', $request->cash_register_id);
        }

        // Фильтр по валюте
        if ($request->filled('currency_id')) {
            $query->where('currency_id', $request->currency_id);
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
     * Сводка по кассам
     */
    public function summary(): JsonResponse
    {
        $cashRegisters = CashRegister::where('is_active', true)
            ->with(['currency'])
            ->get();

        $summary = $cashRegisters->map(function ($cashRegister) {
            $balances = CashBalance::where('cash_register_id', $cashRegister->id)
                ->with('currency')
                ->get();

            return [
                'cash_register' => $cashRegister,
                'balances' => $balances->map(fn($b) => [
                    'currency' => $b->currency,
                    'balance' => $b->balance,
                ]),
                'total_in_default' => $balances->sum('balance'), // TODO: конвертация валют
            ];
        });

        return response()->json($summary);
    }
}
