import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  exchange_rate: string;
  is_default: boolean;
  is_active: boolean;
}

export default function CurrenciesPage() {
  const { hasPermission } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await api.get('/references/currencies');
      setCurrencies(response.data.data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить валюту?')) return;
    try {
      await api.delete(`/references/currencies/${id}`);
      setCurrencies(currencies.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredCurrencies = currencies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Валюты</h1>
        {hasPermission('references.currencies.create') && (
          <Link to="/references/currencies/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить
          </Link>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Название</th>
              <th className="table-header">Код</th>
              <th className="table-header">Символ</th>
              <th className="table-header">Курс</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCurrencies.map((currency) => (
              <tr key={currency.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">
                  <div className="flex items-center gap-2">
                    {currency.name}
                    {currency.is_default && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                </td>
                <td className="table-cell text-gray-500">{currency.code}</td>
                <td className="table-cell">{currency.symbol}</td>
                <td className="table-cell">{parseFloat(currency.exchange_rate).toLocaleString('ru-RU')}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${currency.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {currency.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.currencies.edit') && (
                      <Link to={`/references/currencies/${currency.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.currencies.delete') && !currency.is_default && (
                      <button onClick={() => handleDelete(currency.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCurrencies.length === 0 && (
          <div className="text-center py-8 text-gray-500">Валюты не найдены</div>
        )}
      </div>
    </div>
  );
}
