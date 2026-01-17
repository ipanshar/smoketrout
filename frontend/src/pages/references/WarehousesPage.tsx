import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
}

export default function WarehousesPage() {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/references/warehouses');
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить склад?')) return;
    try {
      await api.delete(`/references/warehouses/${id}`);
      setWarehouses(warehouses.filter((w) => w.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-4 sm:p-6">Загрузка...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Склады</h1>
        {hasPermission('references.warehouses.create') && (
          <Link to="/references/warehouses/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span>
          </Link>
        )}
      </div>

      {/* Search */}
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

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {filteredWarehouses.map((warehouse) => (
          <div key={warehouse.id} className="card p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{warehouse.name}</h3>
                <p className="text-sm text-gray-500">{warehouse.code}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {warehouse.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            {warehouse.address && (
              <p className="text-sm text-gray-600 mb-3">{warehouse.address}</p>
            )}
            <div className="flex gap-3 pt-2 border-t">
              {hasPermission('references.warehouses.edit') && (
                <Link to={`/references/warehouses/${warehouse.id}`} className="text-blue-600 text-sm flex items-center gap-1">
                  <Edit className="w-4 h-4" /> Изменить
                </Link>
              )}
              {hasPermission('references.warehouses.delete') && (
                <button onClick={() => handleDelete(warehouse.id)} className="text-red-600 text-sm flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredWarehouses.length === 0 && (
          <div className="text-center py-8 text-gray-500">Склады не найдены</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Название</th>
                <th className="table-header">Код</th>
                <th className="table-header">Адрес</th>
                <th className="table-header">Статус</th>
                <th className="table-header w-24">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{warehouse.name}</td>
                  <td className="table-cell text-gray-500">{warehouse.code}</td>
                  <td className="table-cell">{warehouse.address || '—'}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs ${warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {warehouse.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {hasPermission('references.warehouses.edit') && (
                        <Link to={`/references/warehouses/${warehouse.id}`} className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {hasPermission('references.warehouses.delete') && (
                        <button onClick={() => handleDelete(warehouse.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWarehouses.length === 0 && (
          <div className="text-center py-8 text-gray-500">Склады не найдены</div>
        )}
      </div>
    </div>
  );
}
