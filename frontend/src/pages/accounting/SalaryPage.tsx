import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import api from '../../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Currency {
  id: number;
  code: string;
  symbol: string;
}

interface SummaryCurrency {
  currency: Currency;
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
}

interface UserBalance {
  currency: Currency;
  accrued: number;
  paid: number;
  balance: number;
}

interface Summary {
  by_currency: SummaryCurrency[];
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
  users: {
    user: User;
    total_accrued: number;
    total_paid: number;
    balance: number;
    balances_by_currency?: UserBalance[];
  }[];
}

interface SalaryBalance {
  user: User;
  balances: {
    currency: Currency;
    accrued: number;
    paid: number;
    balance: number;
  }[];
  total_accrued: number;
  total_paid: number;
  total_balance: number;
}

interface SalaryMovement {
  id: number;
  amount: number;
  type: 'accrual' | 'payment';
  user: User;
  currency: Currency;
  transaction: {
    id: number;
    number: string;
    date: string;
  };
}

export default function SalaryPage() {
  const [balances, setBalances] = useState<SalaryBalance[]>([]);
  const [movements, setMovements] = useState<SalaryMovement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');

  useEffect(() => {
    loadData();
  }, [selectedUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedUser ? { user_id: selectedUser } : {};
      const [balancesRes, movementsRes, summaryRes] = await Promise.all([
        api.get('/accounting/salary/balances', { params }),
        api.get('/accounting/salary/movements', { params }),
        api.get('/accounting/salary/summary'),
      ]);
      setBalances(balancesRes.data);
      setMovements(movementsRes.data.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Зарплата</h1>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      ) : (
        <>
          {/* Summary cards by currency */}
          {summary?.by_currency && summary.by_currency.length > 0 ? (
            summary.by_currency.map((currencyData) => (
              <div key={currencyData.currency.id} className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">{currencyData.currency.code}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Начислено</div>
                        <div className="text-xl font-bold">{currencyData.total_accrued.toLocaleString('ru')} {currencyData.currency.symbol}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Выплачено</div>
                        <div className="text-xl font-bold text-green-600">{currencyData.total_paid.toLocaleString('ru')} {currencyData.currency.symbol}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">К выплате</div>
                        <div className="text-xl font-bold text-orange-600">{currencyData.total_unpaid.toLocaleString('ru')} {currencyData.currency.symbol}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Начислено всего</div>
                    <div className="text-xl font-bold">{summary?.total_accrued?.toLocaleString('ru') || 0}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Выплачено</div>
                    <div className="text-xl font-bold text-green-600">{summary?.total_paid?.toLocaleString('ru') || 0}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">К выплате</div>
                    <div className="text-xl font-bold text-orange-600">{summary?.total_unpaid?.toLocaleString('ru') || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users count card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Сотрудников</div>
                  <div className="text-xl font-bold">{summary?.users?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Users distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold mb-4">Распределение по сотрудникам</h2>
            <div className="space-y-4">
              {summary?.users?.map((u) => (
                <div key={u.user.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-48">
                      <div className="font-medium">{u.user.name}</div>
                      <div className="text-sm text-gray-500">{u.user.email}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {u.total_accrued > 0 && (
                          <>
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${(u.total_paid / u.total_accrued) * 100}%` }}
                              title={`Выплачено: ${u.total_paid.toLocaleString('ru')}`}
                            />
                            <div
                              className="h-full bg-orange-400"
                              style={{ width: `${(u.balance / u.total_accrued) * 100}%` }}
                              title={`К выплате: ${u.balance.toLocaleString('ru')}`}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Balances by currency */}
                  {u.balances_by_currency && u.balances_by_currency.length > 0 && (
                    <div className="ml-52 flex flex-wrap gap-4 text-sm">
                      {u.balances_by_currency.map((bal) => (
                        <div key={bal.currency.id} className="flex items-center gap-2">
                          <span className="font-medium">{bal.currency.code}:</span>
                          <span className="text-green-600">{bal.paid.toLocaleString('ru')} {bal.currency.symbol}</span>
                          {bal.balance > 0 && (
                            <span className="text-orange-600">/ к выплате: {bal.balance.toLocaleString('ru')} {bal.currency.symbol}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(!summary?.users || summary.users.length === 0) && (
                <div className="text-center text-gray-500 py-4">Нет данных о зарплатах</div>
              )}
            </div>
          </div>

          {/* Filter & tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : '')}
                  className="input w-64"
                >
                  <option value="">Все сотрудники</option>
                  {summary?.users?.map((u) => (
                    <option key={u.user.id} value={u.user.id}>{u.user.name}</option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
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
                  История
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'balances' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {balances.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет данных о зарплатах</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Сотрудник</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Валюта</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Начислено</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Выплачено</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">К выплате</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balances.map((b) => (
                        b.balances.map((currBal, idx) => (
                          <tr key={`${b.user.id}-${currBal.currency.id}`} className="hover:bg-gray-50">
                            {idx === 0 && (
                              <td className="px-4 py-3 font-medium" rowSpan={b.balances.length}>
                                <div>{b.user.name}</div>
                                <div className="text-sm text-gray-500">{b.user.email}</div>
                              </td>
                            )}
                            <td className="px-4 py-3 text-gray-600">{currBal.currency.code}</td>
                            <td className="px-4 py-3 text-right">
                              {currBal.accrued.toLocaleString('ru')} {currBal.currency.symbol}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600">
                              {currBal.paid.toLocaleString('ru')} {currBal.currency.symbol}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${currBal.balance > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                              {currBal.balance.toLocaleString('ru')} {currBal.currency.symbol}
                            </td>
                          </tr>
                        ))
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
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Сотрудник</th>
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
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              m.type === 'accrual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {m.type === 'accrual' ? 'Начисление' : 'Выплата'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{m.user.name}</td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            m.type === 'accrual' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {m.type === 'accrual' ? '+' : '-'}{Number(m.amount).toLocaleString('ru')} {m.currency.symbol}
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
