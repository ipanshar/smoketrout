<?php

namespace App\Services;

use App\Models\CashBalance;
use App\Models\CashRegister;
use App\Models\CounterpartyBalance;
use App\Models\PartnerDividendBalance;
use App\Models\SalaryBalance;
use App\Models\StockBalance;
use App\Models\Transaction;
use App\Models\TransactionCashEntry;
use App\Models\TransactionCounterpartyEntry;
use App\Models\TransactionDividendEntry;
use App\Models\TransactionItem;
use App\Models\TransactionSalaryEntry;
use App\Models\TransactionServiceEntry;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    /**
     * Создать транзакцию
     */
    public function create(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            // Валидируем валюты касс
            $this->validateCashRegisterCurrencies($data);
            
            // Генерируем номер документа
            $data['number'] = Transaction::generateNumber($data['type']);
            
            $transaction = Transaction::create($data);

            // Создаём записи в зависимости от типа операции
            $this->createEntries($transaction, $data);

            return $transaction->load(['counterparty', 'partner', 'cashEntries', 'items', 'counterpartyEntries', 'dividendEntries', 'serviceEntries']);
        });
    }

    /**
     * Обновить транзакцию
     */
    public function update(Transaction $transaction, array $data): Transaction
    {
        if ($transaction->isConfirmed()) {
            throw new \Exception('Нельзя редактировать проведённый документ');
        }

        return DB::transaction(function () use ($transaction, $data) {
            // Валидируем валюты касс
            $this->validateCashRegisterCurrencies($data);
            
            // Удаляем старые записи
            $transaction->cashEntries()->delete();
            $transaction->items()->delete();
            $transaction->counterpartyEntries()->delete();
            $transaction->dividendEntries()->delete();
            $transaction->salaryEntries()->delete();
            $transaction->serviceEntries()->delete();

            // Обновляем основные данные
            $transaction->update($data);

            // Создаём новые записи
            $this->createEntries($transaction, $data);

            return $transaction->load(['counterparty', 'partner', 'cashEntries', 'items', 'counterpartyEntries', 'dividendEntries', 'salaryEntries', 'serviceEntries']);
        });
    }

    /**
     * Провести транзакцию (обновить остатки)
     */
    public function confirm(Transaction $transaction): Transaction
    {
        if ($transaction->isConfirmed()) {
            throw new \Exception('Документ уже проведён');
        }

        if ($transaction->isCancelled()) {
            throw new \Exception('Нельзя провести отменённый документ');
        }

        return DB::transaction(function () use ($transaction) {
            // Обновляем остатки по кассе
            foreach ($transaction->cashEntries as $entry) {
                CashBalance::updateBalance(
                    $entry->cash_register_id,
                    $entry->currency_id,
                    $entry->amount
                );
            }

            // Обновляем складские остатки
            foreach ($transaction->items as $item) {
                // Расход со склада-источника
                StockBalance::updateBalance(
                    $item->warehouse_id,
                    $item->product_id,
                    $item->quantity,
                    $item->price
                );

                // Приход на склад-получатель (для перемещений)
                if ($item->warehouse_to_id) {
                    StockBalance::updateBalance(
                        $item->warehouse_to_id,
                        $item->product_id,
                        abs($item->quantity), // Приход положительный
                        $item->price
                    );
                }
            }

            // Обновляем баланс контрагента
            foreach ($transaction->counterpartyEntries as $entry) {
                CounterpartyBalance::updateBalance(
                    $entry->counterparty_id,
                    $entry->currency_id,
                    $entry->amount
                );
            }

            // Обновляем дивиденды
            foreach ($transaction->dividendEntries as $entry) {
                if ($entry->type === TransactionDividendEntry::TYPE_ACCRUAL) {
                    PartnerDividendBalance::accrue(
                        $entry->partner_id,
                        $entry->currency_id,
                        $entry->amount
                    );
                } else {
                    PartnerDividendBalance::pay(
                        $entry->partner_id,
                        $entry->currency_id,
                        $entry->amount
                    );
                }
            }

            // Обновляем зарплаты
            foreach ($transaction->salaryEntries as $entry) {
                if ($entry->type === TransactionSalaryEntry::TYPE_ACCRUAL) {
                    SalaryBalance::accrue(
                        $entry->user_id,
                        $entry->currency_id,
                        $entry->amount
                    );
                } else {
                    SalaryBalance::pay(
                        $entry->user_id,
                        $entry->currency_id,
                        $entry->amount
                    );
                }
            }

            $transaction->update(['status' => Transaction::STATUS_CONFIRMED]);

            return $transaction;
        });
    }

    /**
     * Отменить транзакцию (откатить остатки)
     */
    public function cancel(Transaction $transaction): Transaction
    {
        if (!$transaction->isConfirmed()) {
            // Если ещё не проведён - просто меняем статус
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
            return $transaction;
        }

        return DB::transaction(function () use ($transaction) {
            // Откатываем остатки по кассе
            foreach ($transaction->cashEntries as $entry) {
                CashBalance::updateBalance(
                    $entry->cash_register_id,
                    $entry->currency_id,
                    -$entry->amount // Противоположный знак
                );
            }

            // Откатываем складские остатки
            foreach ($transaction->items as $item) {
                StockBalance::updateBalance(
                    $item->warehouse_id,
                    $item->product_id,
                    -$item->quantity,
                    0 // При откате не пересчитываем себестоимость
                );

                if ($item->warehouse_to_id) {
                    StockBalance::updateBalance(
                        $item->warehouse_to_id,
                        $item->product_id,
                        -abs($item->quantity),
                        0
                    );
                }
            }

            // Откатываем баланс контрагента
            foreach ($transaction->counterpartyEntries as $entry) {
                CounterpartyBalance::updateBalance(
                    $entry->counterparty_id,
                    $entry->currency_id,
                    -$entry->amount
                );
            }

            // Откатываем дивиденды
            foreach ($transaction->dividendEntries as $entry) {
                if ($entry->type === TransactionDividendEntry::TYPE_ACCRUAL) {
                    PartnerDividendBalance::accrue(
                        $entry->partner_id,
                        $entry->currency_id,
                        -$entry->amount
                    );
                } else {
                    PartnerDividendBalance::pay(
                        $entry->partner_id,
                        $entry->currency_id,
                        -$entry->amount
                    );
                }
            }

            // Откатываем зарплаты
            foreach ($transaction->salaryEntries as $entry) {
                if ($entry->type === TransactionSalaryEntry::TYPE_ACCRUAL) {
                    SalaryBalance::accrue(
                        $entry->user_id,
                        $entry->currency_id,
                        -$entry->amount
                    );
                } else {
                    SalaryBalance::pay(
                        $entry->user_id,
                        $entry->currency_id,
                        -$entry->amount
                    );
                }
            }

            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);

            return $transaction;
        });
    }

    /**
     * Удалить транзакцию
     */
    public function delete(Transaction $transaction): void
    {
        if ($transaction->isConfirmed()) {
            throw new \Exception('Нельзя удалить проведённый документ. Сначала отмените его.');
        }

        $transaction->delete();
    }

    /**
     * Создать записи по типу транзакции
     */
    protected function createEntries(Transaction $transaction, array $data): void
    {
        $type = $transaction->type;

        // Кассовые записи
        if (!empty($data['cash_entries'])) {
            foreach ($data['cash_entries'] as $entry) {
                $transaction->cashEntries()->create($entry);
            }
        }

        // Товарные позиции
        if (!empty($data['items'])) {
            foreach ($data['items'] as $item) {
                // Для перемещений: исходящий товар с минусом
                if ($type === Transaction::TYPE_TRANSFER) {
                    $item['quantity'] = -abs($item['quantity']);
                }
                // Для продажи: расход
                elseif ($type === Transaction::TYPE_SALE) {
                    $item['quantity'] = -abs($item['quantity']);
                }
                // Для покупки: приход
                elseif ($type === Transaction::TYPE_PURCHASE) {
                    $item['quantity'] = abs($item['quantity']);
                }
                // Для списания: расход
                elseif ($type === Transaction::TYPE_WRITEOFF) {
                    $item['quantity'] = -abs($item['quantity']);
                }

                $item['amount'] = abs($item['quantity']) * ($item['price'] ?? 0);
                $transaction->items()->create($item);
            }
        }

        // Записи по контрагенту
        if (!empty($data['counterparty_entries'])) {
            foreach ($data['counterparty_entries'] as $entry) {
                $transaction->counterpartyEntries()->create($entry);
            }
        }
        // Автоматические записи по контрагенту для sale/purchase и займов
        elseif ($transaction->counterparty_id && in_array($type, [
            Transaction::TYPE_SALE,
            Transaction::TYPE_SALE_PAYMENT,
            Transaction::TYPE_PURCHASE,
            Transaction::TYPE_PURCHASE_PAYMENT,
            Transaction::TYPE_LOAN_IN,
            Transaction::TYPE_LOAN_OUT,
        ])) {
            $this->createCounterpartyEntry($transaction, $data);
        }

        // Записи дивидендов
        if (!empty($data['dividend_entries'])) {
            foreach ($data['dividend_entries'] as $entry) {
                $transaction->dividendEntries()->create($entry);
            }
        }

        // Записи зарплаты
        if (!empty($data['salary_entries'])) {
            foreach ($data['salary_entries'] as $entry) {
                $transaction->salaryEntries()->create($entry);
            }
        }

        // Записи услуг
        if (!empty($data['service_entries'])) {
            foreach ($data['service_entries'] as $entry) {
                $entry['amount'] = abs($entry['quantity']) * ($entry['price'] ?? 0);
                $transaction->serviceEntries()->create($entry);
            }
        }
    }

    /**
     * Создать автоматическую запись контрагента
     */
    protected function createCounterpartyEntry(Transaction $transaction, array $data): void
    {
        $currencyId = $data['currency_id'] ?? 1; // По умолчанию основная валюта
        $amount = 0;

        switch ($transaction->type) {
            case Transaction::TYPE_SALE:
                // Продажа: контрагент должен нам total - paid
                $amount = $transaction->total_amount - $transaction->paid_amount;
                break;

            case Transaction::TYPE_SALE_PAYMENT:
                // Оплата от покупателя: уменьшаем долг на сумму полученных денег
                // Берём сумму из кассовых записей (они положительные для прихода)
                $cashAmount = $this->getCashEntriesTotal($data);
                $amount = -abs($cashAmount);
                break;

            case Transaction::TYPE_PURCHASE:
                // Покупка: мы должны контрагенту -(total - paid)
                $amount = -($transaction->total_amount - $transaction->paid_amount);
                break;

            case Transaction::TYPE_PURCHASE_PAYMENT:
                // Оплата поставщику: погашаем наш долг на сумму оплаты
                // Берём сумму из кассовых записей (они отрицательные для расхода)
                $cashAmount = $this->getCashEntriesTotal($data);
                $amount = abs($cashAmount);
                break;

            case Transaction::TYPE_LOAN_IN:
                // Займ от контрагента: мы должны контрагенту
                // Получаем деньги в кассу (положительная сумма в кассе)
                // Контрагент нам дал в долг = мы ему должны = отрицательная запись по контрагенту
                $cashAmount = $this->getCashEntriesTotal($data);
                $amount = -abs($cashAmount);
                break;

            case Transaction::TYPE_LOAN_OUT:
                // Займ контрагенту: контрагент должен нам
                // Выдаём деньги из кассы (отрицательная сумма в кассе)
                // Мы дали в долг = контрагент нам должен = положительная запись по контрагенту
                $cashAmount = $this->getCashEntriesTotal($data);
                $amount = abs($cashAmount);
                break;
        }

        if ($amount != 0) {
            $transaction->counterpartyEntries()->create([
                'counterparty_id' => $transaction->counterparty_id,
                'currency_id' => $currencyId,
                'amount' => $amount,
            ]);
        }
    }

    /**
     * Получить общую сумму кассовых записей
     */
    protected function getCashEntriesTotal(array $data): float
    {
        if (empty($data['cash_entries'])) {
            return 0;
        }

        return array_reduce($data['cash_entries'], function ($total, $entry) {
            return $total + ($entry['amount'] ?? 0);
        }, 0);
    }

    /**
     * Валидация соответствия валюты кассы выбранной валюте операции
     */
    protected function validateCashRegisterCurrencies(array $data): void
    {
        if (empty($data['cash_entries'])) {
            return;
        }

        $transactionCurrencyId = $data['currency_id'] ?? null;
        
        foreach ($data['cash_entries'] as $entry) {
            $cashRegister = CashRegister::find($entry['cash_register_id']);
            if (!$cashRegister) {
                continue;
            }

            // Проверяем, что валюта кассы соответствует валюте в записи
            if ($cashRegister->currency_id !== $entry['currency_id']) {
                throw new \Exception(
                    "Касса \"{$cashRegister->name}\" работает только с валютой, которая к ней привязана. " .
                    "Выберите кассу с соответствующей валютой."
                );
            }

            // Если указана валюта транзакции, проверяем соответствие
            if ($transactionCurrencyId && $cashRegister->currency_id !== $transactionCurrencyId) {
                throw new \Exception(
                    "Касса \"{$cashRegister->name}\" не может быть использована для операции в выбранной валюте. " .
                    "Выберите кассу, привязанную к валюте документа."
                );
            }
        }
    }
}
