<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\SalaryBalance;
use App\Models\TransactionSalaryEntry;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    /**
     * Сводка по зарплатам
     */
    public function summary(): JsonResponse
    {
        $balances = SalaryBalance::with(['user', 'currency'])->get();

        // Группируем по валютам
        $byCurrency = $balances->groupBy('currency_id')->map(function ($items) {
            $currency = $items->first()->currency;
            return [
                'currency' => $currency,
                'total_accrued' => $items->sum('accrued'),
                'total_paid' => $items->sum('paid'),
                'total_unpaid' => $items->sum('accrued') - $items->sum('paid'),
            ];
        })->values();

        // Группируем по сотрудникам
        $users = User::whereHas('salaryBalances')->with(['salaryBalances.currency'])->get()->map(function ($user) {
            $balancesByCurrency = $user->salaryBalances->map(function ($balance) {
                return [
                    'currency' => $balance->currency,
                    'accrued' => $balance->accrued,
                    'paid' => $balance->paid,
                    'balance' => $balance->accrued - $balance->paid,
                ];
            });

            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'total_accrued' => $user->salaryBalances->sum('accrued'),
                'total_paid' => $user->salaryBalances->sum('paid'),
                'balance' => $user->salaryBalances->sum('accrued') - $user->salaryBalances->sum('paid'),
                'balances_by_currency' => $balancesByCurrency,
            ];
        });

        return response()->json([
            'by_currency' => $byCurrency,
            'total_accrued' => $balances->sum('accrued'),
            'total_paid' => $balances->sum('paid'),
            'total_unpaid' => $balances->sum('accrued') - $balances->sum('paid'),
            'users' => $users,
        ]);
    }

    /**
     * Балансы по сотрудникам
     */
    public function balances(Request $request): JsonResponse
    {
        $query = User::with(['salaryBalances.currency']);

        if ($request->filled('user_id')) {
            $query->where('id', $request->user_id);
        }

        $users = $query->get()->map(function ($user) {
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'balances' => $user->salaryBalances->map(function ($balance) {
                    return [
                        'currency' => $balance->currency,
                        'accrued' => $balance->accrued,
                        'paid' => $balance->paid,
                        'balance' => $balance->accrued - $balance->paid,
                    ];
                }),
                'total_accrued' => $user->salaryBalances->sum('accrued'),
                'total_paid' => $user->salaryBalances->sum('paid'),
                'total_balance' => $user->salaryBalances->sum('accrued') - $user->salaryBalances->sum('paid'),
            ];
        })->filter(function ($user) {
            // Показываем только тех, у кого есть хоть какие-то балансы
            return $user['balances']->isNotEmpty();
        })->values();

        return response()->json($users);
    }

    /**
     * Движения по зарплате
     */
    public function movements(Request $request): JsonResponse
    {
        $query = TransactionSalaryEntry::with([
            'user',
            'currency',
            'transaction' => function ($q) {
                $q->with(['cashEntries.cashRegister']);
            },
        ])->orderByDesc('created_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $movements = $query->paginate(50);

        return response()->json($movements);
    }
}
