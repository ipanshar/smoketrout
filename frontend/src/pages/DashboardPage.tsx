import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  Factory, 
  TrendingUp,
  DollarSign,
  CreditCard,
  Briefcase,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../lib/api';

interface Currency {
  id: number;
  name: string;
  symbol: string;
}

interface CashSummary {
  currency: Currency;
  total: number;
}

interface CounterpartySummary {
  currency: Currency;
  debt_to_us: number;
  our_debt: number;
}

interface DividendSummary {
  currency: Currency;
  accrued: number;
  paid: number;
  unpaid: number;
}

interface SalarySummary {
  currency: Currency;
  accrued: number;
  paid: number;
  unpaid: number;
}

interface MySalary {
  currency: Currency;
  accrued: number;
  paid: number;
  balance: number;
}

interface RecentTransaction {
  id: number;
  number: string;
  type: string;
  type_label: string;
  date: string;
  total_amount: number;
  currency: Currency;
  counterparty?: { id: number; name: string };
}

interface ChartData {
  date: string;
  label: string;
  income: number;
  expense: number;
}

interface ProductionSummary {
  today: number;
  this_week: number;
  this_month: number;
}

interface DashboardData {
  stats: {
    users_count?: number;
    counterparties_count?: number;
    recipes_count?: number;
    transactions_today?: number;
  };
  my_salary: MySalary[];
  cash_summary?: CashSummary[];
  counterparty_summary?: CounterpartySummary[];
  dividend_summary?: DividendSummary[];
  salary_summary?: SalarySummary[];
  recent_transactions?: RecentTransaction[];
  transactions_chart?: ChartData[];
  production_summary?: ProductionSummary;
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatMoney = (amount: number, symbol: string = '') => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + (symbol ? ` ${symbol}` : '');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: 'text-green-600 bg-green-50',
      purchase: 'text-red-600 bg-red-50',
      sale_payment: 'text-green-600 bg-green-50',
      purchase_payment: 'text-red-600 bg-red-50',
      cash_in: 'text-blue-600 bg-blue-50',
      cash_out: 'text-orange-600 bg-orange-50',
      dividend_accrual: 'text-purple-600 bg-purple-50',
      dividend_payment: 'text-purple-600 bg-purple-50',
      salary_accrual: 'text-indigo-600 bg-indigo-50',
      salary_payment: 'text-indigo-600 bg-indigo-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mySalaryTotal = data?.my_salary?.reduce((sum, s) => sum + s.balance, 0) || 0;
  const hasSalary = mySalaryTotal > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Добро пожаловать, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {data?.stats?.transactions_today !== undefined && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Сегодня: {data.stats.transactions_today} движений
            </span>
          </div>
        )}
      </div>

      {/* My Salary Alert */}
      {hasSalary && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ваша зарплата к выплате</p>
              <div className="mt-2 space-y-1">
                {data?.my_salary?.filter(s => s.balance > 0).map((salary, idx) => (
                  <p key={idx} className="text-3xl font-bold">
                    {formatMoney(salary.balance, salary.currency.symbol)}
                  </p>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.stats?.users_count !== undefined && (
          <div className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.users_count}</p>
                <p className="text-sm text-gray-500">Пользователей</p>
              </div>
            </div>
          </div>
        )}

        {data?.stats?.counterparties_count !== undefined && (
          <div className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.counterparties_count}</p>
                <p className="text-sm text-gray-500">Контрагентов</p>
              </div>
            </div>
          </div>
        )}

        {data?.stats?.recipes_count !== undefined && (
          <div className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Factory className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.recipes_count}</p>
                <p className="text-sm text-gray-500">Рецептов</p>
              </div>
            </div>
          </div>
        )}

        {data?.production_summary && (
          <div className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.production_summary.this_month}</p>
                <p className="text-sm text-gray-500">Производств за месяц</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      {data?.transactions_chart && data.transactions_chart.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Денежный поток за 7 дней
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.transactions_chart} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : String(value)}
                />
                <Tooltip 
                  formatter={(value) => formatMoney(Number(value))}
                  labelFormatter={(label) => `Дата: ${label}`}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  name="Приходы" 
                  dataKey="income" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  name="Расходы" 
                  dataKey="expense" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Balances Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Cash Summary */}
        {data?.cash_summary && data.cash_summary.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Касса</h2>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data.cash_summary.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">{item.currency.name}</span>
                  <span className={`font-semibold ${item.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(item.total, item.currency.symbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counterparty Summary */}
        {data?.counterparty_summary && data.counterparty_summary.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Контрагенты</h2>
              <Briefcase className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data.counterparty_summary.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <span className="text-sm text-gray-500 font-medium">{item.currency.name}</span>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Нам должны:</span>
                    </div>
                    <span className="font-medium text-green-600">
                      {formatMoney(item.debt_to_us, item.currency.symbol)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-gray-600">Мы должны:</span>
                    </div>
                    <span className="font-medium text-red-600">
                      {formatMoney(item.our_debt, item.currency.symbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Summary (for managers) */}
        {data?.salary_summary && data.salary_summary.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Зарплаты</h2>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data.salary_summary.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 font-medium">{item.currency.name}</span>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-gray-600 text-sm">К выплате:</span>
                    <span className="font-semibold text-indigo-600">
                      {formatMoney(item.unpaid, item.currency.symbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dividend Summary */}
        {data?.dividend_summary && data.dividend_summary.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Дивиденды</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data.dividend_summary.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 font-medium">{item.currency.name}</span>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-gray-600 text-sm">К выплате:</span>
                    <span className="font-semibold text-purple-600">
                      {formatMoney(item.unpaid, item.currency.symbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {data?.recent_transactions && data.recent_transactions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние движения</h2>
            <button 
              onClick={() => navigate('/accounting/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Все движения →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Номер</th>
                  <th className="pb-3 font-medium">Тип</th>
                  <th className="pb-3 font-medium">Дата</th>
                  <th className="pb-3 font-medium">Контрагент</th>
                  <th className="pb-3 font-medium text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className="font-medium text-gray-900">{tx.number}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                        {tx.type_label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {new Date(tx.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3 text-gray-600">
                      {tx.counterparty?.name || '—'}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatMoney(tx.total_amount, tx.currency?.symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hasPermission('production.production.create') && (
            <button 
              onClick={() => navigate('/production/productions/new')}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 rounded-xl transition-all text-left group"
            >
              <div className="p-2 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
                <Package className="w-5 h-5 text-purple-700" />
              </div>
              <span className="font-medium text-purple-900">Новое производство</span>
            </button>
          )}
          {hasPermission('accounting.transactions.create') && (
            <button 
              onClick={() => navigate('/accounting/transactions/new')}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 rounded-xl transition-all text-left group"
            >
              <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <span className="font-medium text-blue-900">Новое движение</span>
            </button>
          )}
          {hasPermission('references.counterparties.create') && (
            <button 
              onClick={() => navigate('/references/counterparties/new')}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 rounded-xl transition-all text-left group"
            >
              <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              <span className="font-medium text-green-900">Добавить контрагента</span>
            </button>
          )}
          {hasPermission('production.recipes.create') && (
            <button 
              onClick={() => navigate('/production/recipes/new')}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150 rounded-xl transition-all text-left group"
            >
              <div className="p-2 bg-orange-200 rounded-lg group-hover:bg-orange-300 transition-colors">
                <Factory className="w-5 h-5 text-orange-700" />
              </div>
              <span className="font-medium text-orange-900">Добавить рецепт</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
