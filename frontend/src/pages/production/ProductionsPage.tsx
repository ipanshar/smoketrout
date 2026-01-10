import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Check, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';

interface Production {
  id: number;
  number: string;
  date: string;
  status: string;
  batch_count: number;
  recipe: { id: number; name: string; code: string };
  user: { id: number; name: string };
  output_warehouse: { id: number; name: string };
  ingredients?: any[];
  outputs?: any[];
}

const statusColors: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  confirmed: 'Проведён',
  cancelled: 'Отменён',
};

export default function ProductionsPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Production | null>(null);

  useEffect(() => {
    loadProductions();
  }, [search, statusFilter]);

  const loadProductions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/production/productions?${params}`);
      setProductions(response.data.data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (!confirm('Провести производство? Ингредиенты будут списаны, готовая продукция добавлена.')) return;
    try {
      await api.post(`/production/productions/${id}/confirm`);
      loadProductions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка проведения');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Отменить производство? Изменения будут отменены.')) return;
    try {
      await api.post(`/production/productions/${id}/cancel`);
      loadProductions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка отмены');
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
    } else {
      setExpandedId(id);
      try {
        const response = await api.get(`/production/productions/${id}`);
        setExpandedData(response.data);
      } catch (error) {
        console.error('Error loading production details:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Производство</h1>
        <Link
          to="/production/productions/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Новое производство
        </Link>
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="confirmed">Проведён</option>
          <option value="cancelled">Отменён</option>
        </select>
      </div>

      {/* Список */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {productions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет записей</div>
        ) : (
          <div className="divide-y">
            {productions.map((prod) => (
              <div key={prod.id}>
                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpand(prod.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-blue-600">{prod.number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[prod.status]}`}>
                          {statusLabels[prod.status]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {prod.recipe.name} × {prod.batch_count} партий
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(prod.date).toLocaleDateString('ru')} · {prod.user.name} · {prod.output_warehouse.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prod.status === 'draft' && (
                        <>
                          <Link
                            to={`/production/productions/${prod.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(prod.id);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Провести"
                          >
                            <Check size={18} />
                          </button>
                        </>
                      )}
                      {prod.status === 'confirmed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(prod.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Отменить"
                        >
                          <X size={18} />
                        </button>
                      )}
                      {expandedId === prod.id ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === prod.id && expandedData && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Ингредиенты */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Списанные ингредиенты</h4>
                        <table className="w-full text-sm">
                          <thead className="text-left text-gray-500">
                            <tr>
                              <th className="pb-1">Товар</th>
                              <th className="pb-1 text-right">План</th>
                              <th className="pb-1 text-right">Факт</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedData.ingredients?.map((ing: any) => (
                              <tr key={ing.id}>
                                <td>{ing.product.name}</td>
                                <td className="text-right text-gray-500">{ing.planned_quantity}</td>
                                <td className="text-right">{ing.actual_quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Выход */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Произведённая продукция</h4>
                        <table className="w-full text-sm">
                          <thead className="text-left text-gray-500">
                            <tr>
                              <th className="pb-1">Товар</th>
                              <th className="pb-1 text-right">План</th>
                              <th className="pb-1 text-right">Факт</th>
                              <th className="pb-1 text-right">С/с</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedData.outputs?.map((out: any) => (
                              <tr key={out.id}>
                                <td className="text-green-700">{out.product.name}</td>
                                <td className="text-right text-gray-500">{out.planned_quantity}</td>
                                <td className="text-right text-green-600 font-medium">{out.actual_quantity}</td>
                                <td className="text-right">{Number(out.cost).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
