import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Unit {
  id: number;
  name: string;
  short_name: string;
  is_active: boolean;
}

export default function UnitsPage() {
  const { hasPermission } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await api.get('/references/units');
      setUnits(response.data.data);
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить единицу измерения?')) return;
    try {
      await api.delete(`/references/units/${id}`);
      setUnits(units.filter((u) => u.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(search.toLowerCase()) ||
      unit.short_name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Единицы измерения</h1>
        {hasPermission('references.units.create') && (
          <Link to="/references/units/new" className="btn btn-primary flex items-center gap-2">
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
              <th className="table-header">Сокращение</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUnits.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{unit.name}</td>
                <td className="table-cell">{unit.short_name}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${unit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {unit.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.units.edit') && (
                      <Link to={`/references/units/${unit.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.units.delete') && (
                      <button onClick={() => handleDelete(unit.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUnits.length === 0 && (
          <div className="text-center py-8 text-gray-500">Единицы измерения не найдены</div>
        )}
      </div>
    </div>
  );
}
