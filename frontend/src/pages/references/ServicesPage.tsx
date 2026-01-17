import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';

interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  default_price: number;
  currency_id: number | null;
  currency: Currency | null;
  is_active: boolean;
  created_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  default_price: number;
  currency_id: number | '';
  is_active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    default_price: 0,
    currency_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
  }, [search, showInactive]);

  const loadData = async () => {
    try {
      const [servicesRes, currenciesRes] = await Promise.all([
        api.get('/references/services', {
          params: {
            search,
            all: true,
            is_active: showInactive ? undefined : true,
          },
        }),
        api.get('/references/currencies', { params: { all: true } }),
      ]);
      setServices(servicesRes.data.data || servicesRes.data);
      setCurrencies(currenciesRes.data.data || currenciesRes.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        default_price: Number(service.default_price),
        currency_id: service.currency_id || '',
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      const defaultCurrency = currencies.find(c => (c as any).is_default) || currencies[0];
      setFormData({
        name: '',
        description: '',
        default_price: 0,
        currency_id: defaultCurrency?.id || '',
        is_active: true,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const data = {
        ...formData,
        currency_id: formData.currency_id || null,
      };

      if (editingService) {
        await api.put(`/references/services/${editingService.id}`, data);
      } else {
        await api.post('/references/services', data);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Удалить услугу "${service.name}"?`)) return;

    try {
      await api.delete(`/references/services/${service.id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при удалении');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await api.post(`/references/services/${service.id}/toggle-active`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при изменении статуса');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Услуги</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить услугу
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">Показать неактивные</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена по умолчанию
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Услуги не найдены
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className={!service.is_active ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {service.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(service.default_price).toLocaleString('ru')}{' '}
                      {service.currency?.symbol || '₸'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          service.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {service.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" /> Активна
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" /> Неактивна
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(service)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingService ? 'Редактировать услугу' : 'Новая услуга'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена по умолчанию
                    </label>
                    <input
                      type="number"
                      value={formData.default_price}
                      onChange={(e) => setFormData({ ...formData, default_price: Number(e.target.value) })}
                      className="input"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Валюта
                    </label>
                    <select
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value ? Number(e.target.value) : '' })}
                      className="input"
                    >
                      <option value="">Не указана</option>
                      {currencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Активная услуга</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
