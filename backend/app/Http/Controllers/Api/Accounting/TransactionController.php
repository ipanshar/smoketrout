<?php

namespace App\Http\Controllers\Api\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    /**
     * Список транзакций с фильтрацией
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['counterparty', 'partner', 'user', 'currency'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc');

        // Фильтр по типу
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Фильтр по нескольким типам
        if ($request->filled('types')) {
            $query->whereIn('type', $request->types);
        }

        // Фильтр по статусу
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Фильтр по контрагенту
        if ($request->filled('counterparty_id')) {
            $query->where('counterparty_id', $request->counterparty_id);
        }

        // Фильтр по компаньону
        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        // Фильтр по дате
        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Поиск по номеру
        if ($request->filled('search')) {
            $query->where('number', 'like', '%' . $request->search . '%');
        }

        $transactions = $query->paginate($request->get('per_page', 20));

        return response()->json($transactions);
    }

    /**
     * Получить транзакцию
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load([
            'counterparty',
            'partner',
            'user',
            'cashEntries.cashRegister',
            'cashEntries.currency',
            'items.product.unit',
            'items.warehouse',
            'items.warehouseTo',
            'counterpartyEntries.counterparty',
            'counterpartyEntries.currency',
            'dividendEntries.partner',
            'dividendEntries.currency',
            'salaryEntries.user',
            'salaryEntries.currency',
        ]);

        return response()->json($transaction);
    }

    /**
     * Создать транзакцию
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateTransaction($request);
        $validated['user_id'] = $request->user()->id;

        $transaction = $this->transactionService->create($validated);

        return response()->json($transaction, 201);
    }

    /**
     * Обновить транзакцию
     */
    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $this->validateTransaction($request, $transaction);

        try {
            $transaction = $this->transactionService->update($transaction, $validated);
            return response()->json($transaction);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Провести транзакцию
     */
    public function confirm(Transaction $transaction): JsonResponse
    {
        try {
            $transaction = $this->transactionService->confirm($transaction);
            return response()->json([
                'message' => 'Документ проведён',
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Отменить транзакцию
     */
    public function cancel(Transaction $transaction): JsonResponse
    {
        try {
            $transaction = $this->transactionService->cancel($transaction);
            return response()->json([
                'message' => 'Документ отменён',
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Удалить транзакцию
     */
    public function destroy(Transaction $transaction): JsonResponse
    {
        try {
            $this->transactionService->delete($transaction);
            return response()->json(['message' => 'Документ удалён']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Получить типы транзакций
     */
    public function types(): JsonResponse
    {
        $types = [
            ['value' => Transaction::TYPE_CASH_IN, 'label' => Transaction::getTypeLabel(Transaction::TYPE_CASH_IN)],
            ['value' => Transaction::TYPE_CASH_OUT, 'label' => Transaction::getTypeLabel(Transaction::TYPE_CASH_OUT)],
            ['value' => Transaction::TYPE_SALE, 'label' => Transaction::getTypeLabel(Transaction::TYPE_SALE)],
            ['value' => Transaction::TYPE_SALE_PAYMENT, 'label' => Transaction::getTypeLabel(Transaction::TYPE_SALE_PAYMENT)],
            ['value' => Transaction::TYPE_PURCHASE, 'label' => Transaction::getTypeLabel(Transaction::TYPE_PURCHASE)],
            ['value' => Transaction::TYPE_PURCHASE_PAYMENT, 'label' => Transaction::getTypeLabel(Transaction::TYPE_PURCHASE_PAYMENT)],
            ['value' => Transaction::TYPE_TRANSFER, 'label' => Transaction::getTypeLabel(Transaction::TYPE_TRANSFER)],
            ['value' => Transaction::TYPE_DIVIDEND_ACCRUAL, 'label' => Transaction::getTypeLabel(Transaction::TYPE_DIVIDEND_ACCRUAL)],
            ['value' => Transaction::TYPE_DIVIDEND_PAYMENT, 'label' => Transaction::getTypeLabel(Transaction::TYPE_DIVIDEND_PAYMENT)],
            ['value' => Transaction::TYPE_SALARY_ACCRUAL, 'label' => Transaction::getTypeLabel(Transaction::TYPE_SALARY_ACCRUAL)],
            ['value' => Transaction::TYPE_SALARY_PAYMENT, 'label' => Transaction::getTypeLabel(Transaction::TYPE_SALARY_PAYMENT)],
        ];

        return response()->json($types);
    }

    /**
     * Валидация данных транзакции
     */
    protected function validateTransaction(Request $request, ?Transaction $transaction = null): array
    {
        $rules = [
            'type' => ['required', 'in:cash_in,cash_out,sale,sale_payment,purchase,purchase_payment,transfer,dividend_accrual,dividend_payment,salary_accrual,salary_payment'],
            'date' => ['required', 'date'],
            'counterparty_id' => ['nullable', 'exists:counterparties,id'],
            'partner_id' => ['nullable', 'exists:partners,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'currency_id' => ['nullable', 'exists:currencies,id'],

            // Кассовые записи
            'cash_entries' => ['nullable', 'array'],
            'cash_entries.*.cash_register_id' => ['required', 'exists:cash_registers,id'],
            'cash_entries.*.currency_id' => ['required', 'exists:currencies,id'],
            'cash_entries.*.amount' => ['required', 'numeric'],

            // Товарные позиции
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.warehouse_id' => ['required', 'exists:warehouses,id'],
            'items.*.warehouse_to_id' => ['nullable', 'exists:warehouses,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],

            // Записи контрагента
            'counterparty_entries' => ['nullable', 'array'],
            'counterparty_entries.*.counterparty_id' => ['required', 'exists:counterparties,id'],
            'counterparty_entries.*.currency_id' => ['required', 'exists:currencies,id'],
            'counterparty_entries.*.amount' => ['required', 'numeric'],

            // Записи дивидендов
            'dividend_entries' => ['nullable', 'array'],
            'dividend_entries.*.partner_id' => ['required', 'exists:partners,id'],
            'dividend_entries.*.currency_id' => ['required', 'exists:currencies,id'],
            'dividend_entries.*.type' => ['required', 'in:accrual,payment'],
            'dividend_entries.*.amount' => ['required', 'numeric', 'min:0'],

            // Записи зарплаты
            'salary_entries' => ['nullable', 'array'],
            'salary_entries.*.user_id' => ['required', 'exists:users,id'],
            'salary_entries.*.currency_id' => ['required', 'exists:currencies,id'],
            'salary_entries.*.type' => ['required', 'in:accrual,payment'],
            'salary_entries.*.amount' => ['required', 'numeric', 'min:0'],
        ];

        return $request->validate($rules);
    }
}
