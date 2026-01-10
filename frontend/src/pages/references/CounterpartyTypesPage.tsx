import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CounterpartyType {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  counterparties_count: number;
}

export default function CounterpartyTypesPage() {
  const { hasPermission } = useAuth();
  const [types, setTypes] = useState<CounterpartyType[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const response = await api.get('/references/counterparty-types');
      setTypes(response.data.data);
    } catch (error) {
      console.error('Failed to load counterparty types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тип контрагента?')) return;
    try {
      await api.delete(`/references/counterparty-types/${id}`);
      setTypes(types.filter((t) => t.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredTypes = types.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Типы контрагентов</h1>
        {hasPermission('references.counterparty_types.create') && (
          <Link to="/references/counterparty-types/new" className="btn btn-primary flex items-center gap-2">
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
              <th className="table-header">Контрагентов</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTypes.map((type) => (
              <tr key={type.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{type.name}</td>
                <td className="table-cell text-gray-500">{type.code}</td>
                <td className="table-cell">{type.counterparties_count}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {type.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.counterparty_types.edit') && (
                      <Link to={`/references/counterparty-types/${type.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.counterparty_types.delete') && (
                      <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">Типы контрагентов не найдены</div>
        )}
      </div>
    </div>
  );
}
