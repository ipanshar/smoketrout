import { useState, useEffect } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Counterparty {
  id: number;
  name: string;
  types?: { name: string }[];
}

interface Currency {
  id: number;
  code: string;
  symbol: string;
}

interface BalanceItem {
  currency: Currency;
  balance: number;
  balance_type: 'receivable' | 'payable';
}

interface CounterpartyBalance {
  counterparty: Counterparty;
  balances: BalanceItem[];
}

interface SummaryCurrency {
  currency: Currency;
  total_receivable: number;
  total_payable: number;
}

interface CounterpartyMovement {
  id: number;
  amount: number;
  counterparty: Counterparty;
  currency: Currency;
  transaction: {
    id: number;
    number: string;
    type: string;
    date: string;
  };
}

interface Summary {
  by_currency: SummaryCurrency[];
  debtors_count: number;
  creditors_count: number;
}

export default function CounterpartiesBalancePage() {
  const [balances, setBalances] = useState<CounterpartyBalance[]>([]);
  const [movements, setMovements] = useState<CounterpartyMovement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<number | ''>('');
  const [filter, setFilter] = useState<'all' | 'debtors' | 'creditors'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');

  useEffect(() => {
    loadData();
  }, [selectedCounterparty, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (selectedCounterparty) params.counterparty_id = selectedCounterparty;
      if (filter === 'debtors') params.debtors_only = true;
      if (filter === 'creditors') params.creditors_only = true;

      const [balancesRes, movementsRes, summaryRes] = await Promise.all([
        api.get('/accounting/counterparties/balances', { params }),
        api.get('/accounting/counterparties/movements', { params }),
        api.get('/accounting/counterparties/summary'),
      ]);
      setBalances(balancesRes.data);
      setMovements(movementsRes.data.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading counterparty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: 'Продажа',
      sale_payment: 'Оплата от покупателя',
      purchase: 'Покупка',
      purchase_payment: 'Оплата поставщику',
    };
    return labels[type] || type;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Контрагенты</h1>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Динамически показываем карточки по валютам */}
            {summary?.by_currency?.map((curr) => (
              <div key={curr.currency.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-500 mb-2">{curr.currency.code}</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Нам должны</div>
                    <div className="text-lg font-bold text-green-600">
                      {curr.total_receivable.toLocaleString('ru')} {curr.currency.symbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Мы должны</div>
                    <div className="text-lg font-bold text-red-600">
                      {curr.total_payable.toLocaleString('ru')} {curr.currency.symbol}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Должников</div>
                  <div className="text-xl font-bold">{summary?.debtors_count}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Кредиторов</div>
                  <div className="text-xl font-bold">{summary?.creditors_count}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Контрагент</label>
                <select
                  value={selectedCounterparty}
                  onChange={(e) => setSelectedCounterparty(e.target.value ? Number(e.target.value) : '')}
                  className="input w-64"
                >
                  <option value="">Все контрагенты</option>
                  {balances.map((b) => (
                    <option key={b.counterparty.id} value={b.counterparty.id}>{b.counterparty.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'debtors', label: 'Должники' },
                    { value: 'creditors', label: 'Кредиторы' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filter === opt.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'balances' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Балансы
                </button>
                <button
                  onClick={() => setActiveTab('movements')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'movements' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Движения
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'balances' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {balances.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет данных</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Контрагент</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Типы</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Нам должны</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Мы должны</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Итого</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balances.map((b) => (
                        <tr key={b.counterparty.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{b.counterparty.name}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {b.counterparty.types?.map((t) => t.name).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {b.balances.filter(bl => bl.balance > 0).map((bl, i) => (
                              <div key={i}>{Number(bl.balance).toLocaleString('ru')} {bl.currency.symbol}</div>
                            ))}
                            {b.balances.filter(bl => bl.balance > 0).length === 0 && '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {b.balances.filter(bl => bl.balance < 0).map((bl, i) => (
                              <div key={i}>{Math.abs(Number(bl.balance)).toLocaleString('ru')} {bl.currency.symbol}</div>
                            ))}
                            {b.balances.filter(bl => bl.balance < 0).length === 0 && '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {b.balances.map((bl, i) => {
                              const balance = Number(bl.balance);
                              return (
                                <div key={i} className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {balance >= 0 ? '+' : ''}{balance.toLocaleString('ru')} {bl.currency.symbol}
                                </div>
                              );
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold">История операций</h2>
              </div>

              {movements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет движений</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Дата</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Документ</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
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
                          <td className="px-4 py-3 font-medium">{m.counterparty.name}</td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            Number(m.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(m.amount) >= 0 ? '+' : ''}{Number(m.amount).toLocaleString('ru')} {m.currency.code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
