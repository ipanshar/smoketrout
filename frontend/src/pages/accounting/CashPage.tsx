import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../lib/api';

interface CashRegister {
  id: number;
  name: string;
  type: string;
}

interface CashBalance {
  currency: { id: number; code: string; symbol: string };
  balance: number;
}

interface CashSummary {
  cash_register: CashRegister;
  balances: CashBalance[];
}

interface CashMovement {
  id: number;
  amount: number;
  cash_register: CashRegister;
  currency: { id: number; code: string };
  transaction: {
    id: number;
    number: string;
    type: string;
    date: string;
    description: string | null;
    counterparty?: { name: string } | null;
    partner?: { name: string } | null;
  };
}

export default function CashPage() {
  const [summary, setSummary] = useState<CashSummary[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [selectedCashRegister, setSelectedCashRegister] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCashRegister]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, movementsRes] = await Promise.all([
        api.get('/accounting/cash/summary'),
        api.get('/accounting/cash/movements', {
          params: selectedCashRegister ? { cash_register_id: selectedCashRegister } : {},
        }),
      ]);
      setSummary(summaryRes.data);
      setMovements(movementsRes.data.data);
    } catch (error) {
      console.error('Error loading cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cash_in: 'Приход',
      cash_out: 'Расход',
      sale: 'Продажа',
      sale_payment: 'Оплата от покупателя',
      purchase: 'Покупка',
      purchase_payment: 'Оплата поставщику',
      dividend_payment: 'Выплата дивидендов',
      salary_accrual: 'Начисление зарплаты',
      salary_payment: 'Выплата зарплаты',
    };
    return labels[type] || type;
  };

  // Group totals by currency
  const totalsByCurrency = summary.reduce((acc, s) => {
    s.balances.forEach((b) => {
      const key = b.currency.id;
      if (!acc[key]) {
        acc[key] = { currency: b.currency, balance: 0 };
      }
      acc[key].balance += Number(b.balance);
    });
    return acc;
  }, {} as Record<number, { currency: { id: number; code: string; symbol: string }; balance: number }>);
  const currencyTotals = Object.values(totalsByCurrency);

  return (
    <div>
      <h1 className="page-title mb-6">Касса</h1>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      ) : (
        <>
          {/* Total balance by currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {currencyTotals.map((ct) => (
              <div key={ct.currency.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Баланс ({ct.currency.code})</div>
                    <div className="text-xl font-bold">{ct.balance.toLocaleString('ru')} {ct.currency.symbol}</div>
                  </div>
                </div>
              </div>
            ))}

            {summary.map((s) => (
              <div key={s.cash_register.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="font-medium text-gray-900 mb-2">{s.cash_register.name}</div>
                {s.balances.map((b) => (
                  <div key={b.currency.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{b.currency.code}</span>
                    <span className={`font-medium ${Number(b.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(b.balance).toLocaleString('ru')}
                    </span>
                  </div>
                ))}
                {s.balances.length === 0 && (
                  <div className="text-sm text-gray-400">Нет операций</div>
                )}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Фильтр по кассе</label>
            <select
              value={selectedCashRegister}
              onChange={(e) => setSelectedCashRegister(e.target.value ? Number(e.target.value) : '')}
              className="input w-full sm:w-64"
            >
              <option value="">Все кассы</option>
              {summary.map((s) => (
                <option key={s.cash_register.id} value={s.cash_register.id}>{s.cash_register.name}</option>
              ))}
            </select>
          </div>

          {/* Movements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold">История движений</h2>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Нет движений</div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-gray-200">
                  {movements.map((m) => (
                    <div key={m.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-primary-600 font-medium">{m.transaction.number}</span>
                        <span className={`font-medium ${Number(m.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(m.amount) >= 0 ? '+' : ''}{Number(m.amount).toLocaleString('ru')} {m.currency.code}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Дата:</span>
                          <span>{new Date(m.transaction.date).toLocaleDateString('ru')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Тип:</span>
                          <span>{getTypeLabel(m.transaction.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Касса:</span>
                          <span>{m.cash_register.name}</span>
                        </div>
                        {(m.transaction.counterparty || m.transaction.partner) && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Контрагент:</span>
                            <span>{m.transaction.counterparty?.name || m.transaction.partner?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Дата</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Документ</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Касса</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Контрагент</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(m.transaction.date).toLocaleDateString('ru')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-primary-600 font-medium">{m.transaction.number}</span>
                          </td>
                          <td className="px-4 py-3">{getTypeLabel(m.transaction.type)}</td>
                          <td className="px-4 py-3 text-gray-600">{m.cash_register.name}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {m.transaction.counterparty?.name || m.transaction.partner?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`flex items-center justify-end gap-1 font-medium ${
                              Number(m.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(m.amount) >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {Number(m.amount).toLocaleString('ru')} {m.currency.code}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
