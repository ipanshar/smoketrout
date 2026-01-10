import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import api from '../../lib/api';

interface Transaction {
  id: number;
  type: string;
  number: string;
  date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  description: string | null;
  currency?: { id: number; code: string; symbol: string } | null;
  counterparty?: { id: number; name: string } | null;
  partner?: { id: number; name: string } | null;
  user: { id: number; name: string };
}

interface TransactionType {
  value: string;
  label: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  confirmed: 'Проведён',
  cancelled: 'Отменён',
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [searchParams]);

  const loadTypes = async () => {
    try {
      const response = await api.get('/accounting/transactions/types');
      setTypes(response.data);
    } catch (error) {
      console.error('Error loading types:', error);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounting/transactions', {
        params: Object.fromEntries(searchParams),
      });
      setTransactions(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchParams({});
  };

  const handleConfirm = async (id: number) => {
    if (!confirm('Провести документ?')) return;
    try {
      await api.post(`/accounting/transactions/${id}/confirm`);
      loadTransactions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при проведении');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Отменить документ?')) return;
    try {
      await api.post(`/accounting/transactions/${id}/cancel`);
      loadTransactions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при отмене');
    }
  };

  const getTypeLabel = (type: string) => {
    return types.find((t) => t.value === type)?.label || type;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Движения</h1>
        <Link to="/accounting/transactions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Создать
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Фильтры</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Поиск по номеру</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ПР-26-0001"
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Тип операции</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
              <option value="">Все типы</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Статус</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="confirmed">Проведён</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Дата с</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Дата по</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={applyFilters} className="btn-primary">Применить</button>
          <button onClick={clearFilters} className="btn-secondary">Сбросить</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет данных</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Номер</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Дата</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Контрагент/Компаньон</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Сумма</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Статус</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/accounting/transactions/${t.id}`} className="text-primary-600 hover:underline font-medium">
                        {t.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString('ru')}</td>
                    <td className="px-4 py-3">{getTypeLabel(t.type)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.counterparty?.name || t.partner?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {Number(t.total_amount).toLocaleString('ru')} {t.currency?.symbol || ''}
                      {t.paid_amount > 0 && t.paid_amount < t.total_amount && (
                        <span className="text-sm text-gray-500 block">
                          оплачено: {Number(t.paid_amount).toLocaleString('ru')} {t.currency?.symbol || ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[t.status]}`}>
                        {statusLabels[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/accounting/transactions/${t.id}`} className="p-1.5 text-gray-400 hover:text-primary-600" title="Просмотр">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {t.status === 'draft' && (
                          <button onClick={() => handleConfirm(t.id)} className="p-1.5 text-gray-400 hover:text-green-600" title="Провести">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {t.status === 'confirmed' && (
                          <button onClick={() => handleCancel(t.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Отменить">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Всего: {pagination.total}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page) })}
                  className={`px-3 py-1 rounded ${
                    page === pagination.current_page ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
