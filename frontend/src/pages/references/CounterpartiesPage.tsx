import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Counterparty {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  inn: string | null;
  is_active: boolean;
  types: { id: number; name: string }[];
}

export default function CounterpartiesPage() {
  const { hasPermission } = useAuth();
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCounterparties();
  }, []);

  const loadCounterparties = async () => {
    try {
      const response = await api.get('/references/counterparties');
      setCounterparties(response.data.data);
    } catch (error) {
      console.error('Failed to load counterparties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить контрагента?')) return;
    try {
      await api.delete(`/references/counterparties/${id}`);
      setCounterparties(counterparties.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredCounterparties = counterparties.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.inn && c.inn.includes(search))
  );

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Контрагенты</h1>
        {hasPermission('references.counterparties.create') && (
          <Link to="/references/counterparties/new" className="btn btn-primary flex items-center gap-2">
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
            placeholder="Поиск по имени, телефону, ИНН..."
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
              <th className="table-header">Тип</th>
              <th className="table-header">Телефон</th>
              <th className="table-header">ИНН</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCounterparties.map((cp) => (
              <tr key={cp.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{cp.name}</td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1">
                    {cp.types?.map((t) => (
                      <span key={t.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="table-cell">{cp.phone || '—'}</td>
                <td className="table-cell">{cp.inn || '—'}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${cp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {cp.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.counterparties.edit') && (
                      <Link to={`/references/counterparties/${cp.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.counterparties.delete') && (
                      <button onClick={() => handleDelete(cp.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCounterparties.length === 0 && (
          <div className="text-center py-8 text-gray-500">Контрагенты не найдены</div>
        )}
      </div>
    </div>
  );
}
