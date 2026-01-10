<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBalance;
use App\Models\CounterpartyBalance;
use App\Models\PartnerDividendBalance;
use App\Models\Production;
use App\Models\SalaryBalance;
use App\Models\StockBalance;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Counterparty;
use App\Models\Recipe;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Получить данные для дашборда
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = [];

        // Общая статистика (для всех)
        $data['stats'] = $this->getGeneralStats($user);

        // Баланс зарплаты текущего пользователя (для всех)
        $data['my_salary'] = $this->getMySalary($user);

        // Данные кассы (если есть права)
        if ($user->hasPermission('accounting.cash.view')) {
            $data['cash_summary'] = $this->getCashSummary();
        }

        // Данные по контрагентам (если есть права)
        if ($user->hasPermission('accounting.counterparties.view')) {
            $data['counterparty_summary'] = $this->getCounterpartySummary();
        }

        // Данные по дивидендам (если есть права)
        if ($user->hasPermission('accounting.dividends.view')) {
            $data['dividend_summary'] = $this->getDividendSummary();
        }

        // Данные по зарплатам всех (если есть права)
        if ($user->hasPermission('accounting.salary.view')) {
            $data['salary_summary'] = $this->getSalarySummary();
        }

        // Последние транзакции (если есть права)
        if ($user->hasPermission('accounting.transactions.view')) {
            $data['recent_transactions'] = $this->getRecentTransactions();
            $data['transactions_chart'] = $this->getTransactionsChart();
        }

        // Производство (если есть права)
        if ($user->hasPermission('production.production.view')) {
            $data['production_summary'] = $this->getProductionSummary();
        }

        return response()->json($data);
    }

    /**
     * Общая статистика
     */
    protected function getGeneralStats($user): array
    {
        $stats = [];

        if ($user->hasPermission('admin.users.view')) {
            $stats['users_count'] = User::count();
        }

        if ($user->hasPermission('references.counterparties.view')) {
            $stats['counterparties_count'] = Counterparty::count();
        }

        if ($user->hasPermission('production.recipes.view')) {
            $stats['recipes_count'] = Recipe::count();
        }

        if ($user->hasPermission('accounting.transactions.view')) {
            $stats['transactions_today'] = Transaction::whereDate('date', today())
                ->where('status', Transaction::STATUS_CONFIRMED)
                ->count();
        }

        return $stats;
    }

    /**
     * Баланс зарплаты текущего пользователя
     */
    protected function getMySalary($user): array
    {
        $balances = SalaryBalance::where('user_id', $user->id)
            ->with('currency')
            ->get();

        return $balances->map(function ($balance) {
            return [
                'currency' => $balance->currency,
                'accrued' => (float) $balance->accrued,
                'paid' => (float) $balance->paid,
                'balance' => (float) $balance->balance,
            ];
        })->toArray();
    }

    /**
     * Сводка по кассе
     */
    protected function getCashSummary(): array
    {
        $balances = CashBalance::with(['cashRegister', 'currency'])
            ->get()
            ->groupBy('currency_id');

        $result = [];
        foreach ($balances as $currencyId => $items) {
            $currency = $items->first()->currency;
            $total = $items->sum('balance');
            $result[] = [
                'currency' => $currency,
                'total' => (float) $total,
            ];
        }

        return $result;
    }

    /**
     * Сводка по контрагентам
     */
    protected function getCounterpartySummary(): array
    {
        $balances = CounterpartyBalance::with('currency')
            ->get()
            ->groupBy('currency_id');

        $result = [];
        foreach ($balances as $currencyId => $items) {
            $currency = $items->first()->currency;
            $debtToUs = $items->where('balance', '>', 0)->sum('balance');
            $ourDebt = abs($items->where('balance', '<', 0)->sum('balance'));
            $result[] = [
                'currency' => $currency,
                'debt_to_us' => (float) $debtToUs,
                'our_debt' => (float) $ourDebt,
            ];
        }

        return $result;
    }

    /**
     * Сводка по дивидендам
     */
    protected function getDividendSummary(): array
    {
        $balances = PartnerDividendBalance::with('currency')
            ->get()
            ->groupBy('currency_id');

        $result = [];
        foreach ($balances as $currencyId => $items) {
            $currency = $items->first()->currency;
            $totalAccrued = $items->sum('total_accrued');
            $totalPaid = $items->sum('total_paid');
            $result[] = [
                'currency' => $currency,
                'accrued' => (float) $totalAccrued,
                'paid' => (float) $totalPaid,
                'unpaid' => (float) ($totalAccrued - $totalPaid),
            ];
        }

        return $result;
    }

    /**
     * Сводка по зарплатам
     */
    protected function getSalarySummary(): array
    {
        $balances = SalaryBalance::with('currency')
            ->get()
            ->groupBy('currency_id');

        $result = [];
        foreach ($balances as $currencyId => $items) {
            $currency = $items->first()->currency;
            $totalAccrued = $items->sum('accrued');
            $totalPaid = $items->sum('paid');
            $result[] = [
                'currency' => $currency,
                'accrued' => (float) $totalAccrued,
                'paid' => (float) $totalPaid,
                'unpaid' => (float) ($totalAccrued - $totalPaid),
            ];
        }

        return $result;
    }

    /**
     * Последние транзакции
     */
    protected function getRecentTransactions(): array
    {
        return Transaction::with(['counterparty', 'user', 'currency'])
            ->where('status', Transaction::STATUS_CONFIRMED)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'number' => $t->number,
                    'type' => $t->type,
                    'type_label' => Transaction::getTypeLabel($t->type),
                    'date' => $t->date,
                    'total_amount' => (float) $t->total_amount,
                    'currency' => $t->currency,
                    'counterparty' => $t->counterparty,
                ];
            })
            ->toArray();
    }

    /**
     * Данные для графика транзакций за последние 7 дней
     */
    protected function getTransactionsChart(): array
    {
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $days[$date] = [
                'date' => $date,
                'label' => now()->subDays($i)->format('d.m'),
                'income' => 0,
                'expense' => 0,
            ];
        }

        // Приходы (продажи, оплаты от покупателей, приход денег)
        $incomeTypes = [Transaction::TYPE_SALE, Transaction::TYPE_SALE_PAYMENT, Transaction::TYPE_CASH_IN];
        $incomes = Transaction::whereIn('type', $incomeTypes)
            ->where('status', Transaction::STATUS_CONFIRMED)
            ->whereDate('date', '>=', now()->subDays(6))
            ->selectRaw('DATE(date) as day, SUM(total_amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        foreach ($incomes as $day => $total) {
            if (isset($days[$day])) {
                $days[$day]['income'] = (float) $total;
            }
        }

        // Расходы (покупки, оплаты поставщикам, расход денег, выплаты дивидендов, зарплат)
        $expenseTypes = [
            Transaction::TYPE_PURCHASE, 
            Transaction::TYPE_PURCHASE_PAYMENT, 
            Transaction::TYPE_CASH_OUT,
            Transaction::TYPE_DIVIDEND_PAYMENT,
            Transaction::TYPE_SALARY_PAYMENT,
        ];
        $expenses = Transaction::whereIn('type', $expenseTypes)
            ->where('status', Transaction::STATUS_CONFIRMED)
            ->whereDate('date', '>=', now()->subDays(6))
            ->selectRaw('DATE(date) as day, SUM(total_amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        foreach ($expenses as $day => $total) {
            if (isset($days[$day])) {
                $days[$day]['expense'] = (float) $total;
            }
        }

        return array_values($days);
    }

    /**
     * Сводка по производству
     */
    protected function getProductionSummary(): array
    {
        $today = Production::whereDate('date', today())->count();
        $thisWeek = Production::whereDate('date', '>=', now()->startOfWeek())->count();
        $thisMonth = Production::whereDate('date', '>=', now()->startOfMonth())->count();

        return [
            'today' => $today,
            'this_week' => $thisWeek,
            'this_month' => $thisMonth,
        ];
    }
}
