<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerDividendBalance;
use App\Models\TransactionDividendEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DividendController extends Controller
{
    /**
     * Балансы дивидендов компаньонов
     */
    public function balances(Request $request): JsonResponse
    {
        $query = PartnerDividendBalance::with(['partner', 'currency']);

        // Фильтр по компаньону
        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        // Только с задолженностью
        if ($request->boolean('unpaid_only')) {
            $query->where('balance', '>', 0);
        }

        $balances = $query->get()->groupBy('partner_id')->map(function ($items) {
            $partner = $items->first()->partner;
            return [
                'partner' => $partner,
                'balances' => $items->map(fn($item) => [
                    'currency' => $item->currency,
                    'total_accrued' => $item->total_accrued,
                    'total_paid' => $item->total_paid,
                    'balance' => $item->balance, // К выплате
                ]),
                'total_accrued' => $items->sum('total_accrued'),
                'total_paid' => $items->sum('total_paid'),
                'total_balance' => $items->sum('balance'),
            ];
        })->values();

        return response()->json($balances);
    }

    /**
     * Движения дивидендов
     */
    public function movements(Request $request): JsonResponse
    {
        $query = TransactionDividendEntry::with([
            'transaction' => function ($q) {
                $q->with(['user']);
            },
            'partner',
            'currency',
        ])
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->orderBy('created_at', 'desc');

        // Фильтр по компаньону
        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        // Фильтр по типу (начисление/выплата)
        if ($request->filled('type')) {
            $query->where('type', $request->type);
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
     * Сводка по дивидендам
     */
    public function summary(): JsonResponse
    {
        $partners = Partner::where('is_active', true)->get();
        $balances = PartnerDividendBalance::with(['partner', 'currency'])->get();

        // Группируем по валютам
        $byCurrency = $balances->groupBy('currency_id')->map(function ($items) {
            $currency = $items->first()->currency;
            return [
                'currency' => $currency,
                'total_accrued' => $items->sum('total_accrued'),
                'total_paid' => $items->sum('total_paid'),
                'total_unpaid' => $items->sum('balance'),
            ];
        })->values();

        $summary = [
            'by_currency' => $byCurrency,
            'total_accrued' => $balances->sum('total_accrued'),
            'total_paid' => $balances->sum('total_paid'),
            'total_unpaid' => $balances->sum('balance'),
            'partners' => $partners->map(function ($partner) use ($balances) {
                $partnerBalances = $balances->where('partner_id', $partner->id);
                return [
                    'partner' => $partner,
                    'share_percentage' => $partner->share_percentage,
                    'total_accrued' => $partnerBalances->sum('total_accrued'),
                    'total_paid' => $partnerBalances->sum('total_paid'),
                    'balance' => $partnerBalances->sum('balance'),
                    'balances_by_currency' => $partnerBalances->map(fn($b) => [
                        'currency' => $b->currency,
                        'total_accrued' => $b->total_accrued,
                        'total_paid' => $b->total_paid,
                        'balance' => $b->balance,
                    ])->values(),
                ];
            }),
        ];

        return response()->json($summary);
    }

    /**
     * Рассчитать дивиденды для распределения
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency_id' => ['required', 'exists:currencies,id'],
        ]);

        $amount = $request->amount;
        $partners = Partner::where('is_active', true)->get();

        $distribution = $partners->map(function ($partner) use ($amount) {
            $partnerAmount = round($amount * $partner->share_percentage / 100, 2);
            return [
                'partner' => $partner,
                'share_percentage' => $partner->share_percentage,
                'amount' => $partnerAmount,
            ];
        });

        // Коррекция копеек на последнего компаньона
        $totalDistributed = $distribution->sum('amount');
        $diff = $amount - $totalDistributed;
        if ($diff != 0 && $distribution->count() > 0) {
            $distribution = $distribution->map(function ($item, $index) use ($distribution, $diff) {
                if ($index === $distribution->count() - 1) {
                    $item['amount'] += $diff;
                }
                return $item;
            });
        }

        return response()->json([
            'total_amount' => $amount,
            'distribution' => $distribution,
        ]);
    }
}
