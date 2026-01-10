<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    public const TYPE_CASH_IN = 'cash_in';
    public const TYPE_CASH_OUT = 'cash_out';
    public const TYPE_SALE = 'sale';
    public const TYPE_SALE_PAYMENT = 'sale_payment';
    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_PURCHASE_PAYMENT = 'purchase_payment';
    public const TYPE_TRANSFER = 'transfer';
    public const TYPE_DIVIDEND_ACCRUAL = 'dividend_accrual';
    public const TYPE_DIVIDEND_PAYMENT = 'dividend_payment';
    public const TYPE_SALARY_ACCRUAL = 'salary_accrual';
    public const TYPE_SALARY_PAYMENT = 'salary_payment';

    public const STATUS_DRAFT = 'draft';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';

    // Префиксы для номеров документов
    public const NUMBER_PREFIXES = [
        self::TYPE_CASH_IN => 'ПД',          // Приход денег
        self::TYPE_CASH_OUT => 'РД',         // Расход денег
        self::TYPE_SALE => 'ПР',             // Продажа
        self::TYPE_SALE_PAYMENT => 'ОП',     // Оплата от покупателя
        self::TYPE_PURCHASE => 'ПК',         // Покупка
        self::TYPE_PURCHASE_PAYMENT => 'ОС', // Оплата поставщику
        self::TYPE_TRANSFER => 'ПМ',         // Перемещение
        self::TYPE_DIVIDEND_ACCRUAL => 'НД', // Начисление дивидендов
        self::TYPE_DIVIDEND_PAYMENT => 'ВД', // Выплата дивидендов
        self::TYPE_SALARY_ACCRUAL => 'НЗ',   // Начисление зарплаты
        self::TYPE_SALARY_PAYMENT => 'ВЗ',   // Выплата зарплаты
    ];

    protected $fillable = [
        'type',
        'number',
        'date',
        'counterparty_id',
        'partner_id',
        'description',
        'total_amount',
        'paid_amount',
        'currency_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function counterparty(): BelongsTo
    {
        return $this->belongsTo(Counterparty::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function cashEntries(): HasMany
    {
        return $this->hasMany(TransactionCashEntry::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function counterpartyEntries(): HasMany
    {
        return $this->hasMany(TransactionCounterpartyEntry::class);
    }

    public function dividendEntries(): HasMany
    {
        return $this->hasMany(TransactionDividendEntry::class);
    }

    public function salaryEntries(): HasMany
    {
        return $this->hasMany(TransactionSalaryEntry::class);
    }

    public function getDebtAmountAttribute(): float
    {
        return $this->total_amount - $this->paid_amount;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public static function generateNumber(string $type): string
    {
        $prefix = self::NUMBER_PREFIXES[$type] ?? 'XX';
        $year = date('y');
        
        $lastNumber = self::where('type', $type)
            ->whereYear('created_at', date('Y'))
            ->max('id') ?? 0;
        
        return sprintf('%s-%s-%04d', $prefix, $year, $lastNumber + 1);
    }

    public static function getTypeLabel(string $type): string
    {
        return match($type) {
            self::TYPE_CASH_IN => 'Приход денег',
            self::TYPE_CASH_OUT => 'Расход денег',
            self::TYPE_SALE => 'Продажа',
            self::TYPE_SALE_PAYMENT => 'Оплата от покупателя',
            self::TYPE_PURCHASE => 'Покупка',
            self::TYPE_PURCHASE_PAYMENT => 'Оплата поставщику',
            self::TYPE_TRANSFER => 'Перемещение',
            self::TYPE_DIVIDEND_ACCRUAL => 'Начисление дивидендов',
            self::TYPE_DIVIDEND_PAYMENT => 'Выплата дивидендов',
            self::TYPE_SALARY_ACCRUAL => 'Начисление зарплаты',
            self::TYPE_SALARY_PAYMENT => 'Выплата зарплаты',
            default => $type,
        };
    }

    public static function getStatusLabel(string $status): string
    {
        return match($status) {
            self::STATUS_DRAFT => 'Черновик',
            self::STATUS_CONFIRMED => 'Проведён',
            self::STATUS_CANCELLED => 'Отменён',
            default => $status,
        };
    }
}
