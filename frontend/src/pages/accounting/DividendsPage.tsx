import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import api from '../../lib/api';

interface Partner {
  id: number;
  name: string;
  share_percentage: number;
}

interface Currency {
  id: number;
  code: string;
  symbol: string;
}

interface DividendBalance {
  partner: Partner;
  balances: {
    currency: Currency;
    total_accrued: number;
    total_paid: number;
    balance: number;
  }[];
  total_accrued: number;
  total_paid: number;
  total_balance: number;
}

interface DividendMovement {
  id: number;
  amount: number;
  type: 'accrual' | 'payment';
  partner: Partner;
  currency: Currency;
  transaction: {
    id: number;
    number: string;
    date: string;
  };
}

interface SummaryCurrency {
  currency: Currency;
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
}

interface PartnerBalance {
  currency: Currency;
  total_accrued: number;
  total_paid: number;
  balance: number;
}

interface Summary {
  by_currency: SummaryCurrency[];
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
  partners: {
    partner: Partner;
    share_percentage: number;
    total_accrued: number;
    total_paid: number;
    balance: number;
    balances_by_currency?: PartnerBalance[];
  }[];
}

export default function DividendsPage() {
  const [balances, setBalances] = useState<DividendBalance[]>([]);
  const [movements, setMovements] = useState<DividendMovement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');

  useEffect(() => {
    loadData();
  }, [selectedPartner]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedPartner ? { partner_id: selectedPartner } : {};
      const [balancesRes, movementsRes, summaryRes] = await Promise.all([
        api.get('/accounting/dividends/balances', { params }),
        api.get('/accounting/dividends/movements', { params }),
        api.get('/accounting/dividends/summary'),
      ]);
      setBalances(balancesRes.data);
      setMovements(movementsRes.data.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading dividend data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Дивиденды</h1>

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
                        <Wallet className="w-6 h-6 text-green-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Начислено всего</div>
                    <div className="text-xl font-bold">{summary?.total_accrued.toLocaleString('ru')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Выплачено</div>
                    <div className="text-xl font-bold text-green-600">{summary?.total_paid.toLocaleString('ru')}</div>
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
                    <div className="text-xl font-bold text-orange-600">{summary?.total_unpaid.toLocaleString('ru')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Компаньонов</div>
                    <div className="text-xl font-bold">{summary?.partners.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Partners count card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Компаньонов</div>
                  <div className="text-xl font-bold">{summary?.partners.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Partners distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold mb-4">Распределение по компаньонам</h2>
            <div className="space-y-4">
              {summary?.partners.map((p) => (
                <div key={p.partner.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-40">
                      <div className="font-medium">{p.partner.name}</div>
                      <div className="text-sm text-gray-500">{p.share_percentage}%</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {p.total_accrued > 0 && (
                          <>
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${(p.total_paid / p.total_accrued) * 100}%` }}
                              title={`Выплачено: ${p.total_paid.toLocaleString('ru')}`}
                            />
                            <div
                              className="h-full bg-orange-400"
                              style={{ width: `${(p.balance / p.total_accrued) * 100}%` }}
                              title={`К выплате: ${p.balance.toLocaleString('ru')}`}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Balances by currency */}
                  {p.balances_by_currency && p.balances_by_currency.length > 0 && (
                    <div className="ml-44 flex flex-wrap gap-4 text-sm">
                      {p.balances_by_currency.map((bal) => (
                        <div key={bal.currency.id} className="flex items-center gap-2">
                          <span className="font-medium">{bal.currency.code}:</span>
                          <span className="text-green-600">{bal.total_paid.toLocaleString('ru')} {bal.currency.symbol}</span>
                          {bal.balance > 0 && (
                            <span className="text-orange-600">/ к выплате: {bal.balance.toLocaleString('ru')} {bal.currency.symbol}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Компаньон</label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value ? Number(e.target.value) : '')}
                  className="input w-64"
                >
                  <option value="">Все компаньоны</option>
                  {summary?.partners.map((p) => (
                    <option key={p.partner.id} value={p.partner.id}>
                      {p.partner.name} ({p.share_percentage}%)
                    </option>
                  ))}
                </select>
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
                  История
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'balances' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {balances.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет данных о дивидендах</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Компаньон</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Доля</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Валюта</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Начислено</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Выплачено</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">К выплате</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balances.map((b) => (
                        b.balances.map((currBal, idx) => (
                          <tr key={`${b.partner.id}-${currBal.currency.id}`} className="hover:bg-gray-50">
                            {idx === 0 && (
                              <>
                                <td className="px-4 py-3 font-medium" rowSpan={b.balances.length}>
                                  {b.partner.name}
                                </td>
                                <td className="px-4 py-3 text-center" rowSpan={b.balances.length}>
                                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                    {b.partner.share_percentage}%
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-gray-600">{currBal.currency.code}</td>
                            <td className="px-4 py-3 text-right">
                              {currBal.total_accrued.toLocaleString('ru')} {currBal.currency.symbol}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600">
                              {currBal.total_paid.toLocaleString('ru')} {currBal.currency.symbol}
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
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Компаньон</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
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
                          <td className="px-4 py-3 font-medium">{m.partner.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              m.type === 'accrual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {m.type === 'accrual' ? 'Начисление' : 'Выплата'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            m.type === 'accrual' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {m.type === 'accrual' ? '+' : '-'}{Number(m.amount).toLocaleString('ru')} {m.currency.code}
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
