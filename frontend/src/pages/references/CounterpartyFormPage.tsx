import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

interface CounterpartyType {
  id: number;
  name: string;
}

interface FormData {
  type_ids: number[];
  name: string;
  phone: string;
  email: string;
  address: string;
  inn: string;
  kpp: string;
  notes: string;
  is_active: boolean;
}

export default function CounterpartyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    type_ids: [],
    name: '',
    phone: '',
    email: '',
    address: '',
    inn: '',
    kpp: '',
    notes: '',
    is_active: true,
  });
  const [types, setTypes] = useState<CounterpartyType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTypes();
    if (isEditing) {
      loadCounterparty();
    }
  }, [id]);

  const loadTypes = async () => {
    try {
      const response = await api.get('/references/counterparty-types?active=true');
      setTypes(response.data.data);
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  };

  const loadCounterparty = async () => {
    try {
      const response = await api.get(`/references/counterparties/${id}`);
      const c = response.data;
      setFormData({
        type_ids: c.types?.map((t: CounterpartyType) => t.id) || [],
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        inn: c.inn || '',
        kpp: c.kpp || '',
        notes: c.notes || '',
        is_active: c.is_active,
      });
    } catch (error) {
      navigate('/references/counterparties');
    }
  };

  const handleTypeToggle = (typeId: number) => {
    setFormData((prev) => {
      const newTypeIds = prev.type_ids.includes(typeId)
        ? prev.type_ids.filter((id) => id !== typeId)
        : [...prev.type_ids, typeId];
      return { ...prev, type_ids: newTypeIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isEditing) {
        await api.put(`/references/counterparties/${id}`, formData);
      } else {
        await api.post('/references/counterparties', formData);
      }
      navigate('/references/counterparties');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Редактирование контрагента' : 'Новый контрагент'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Типы контрагента</label>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <label
                key={t.id}
                className={`px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.type_ids.includes(t.id)
                    ? 'bg-primary-100 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.type_ids.includes(t.id)}
                  onChange={() => handleTypeToggle(t.id)}
                  className="sr-only"
                />
                {t.name}
              </label>
            ))}
          </div>
          {errors.type_ids && <p className="text-red-500 text-sm mt-1">{errors.type_ids}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="ООО Рыба и Ко"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="info@company.ru"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
            <input
              type="text"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">КПП</label>
            <input
              type="text"
              value={formData.kpp}
              onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-primary-600"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Активен</label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => navigate('/references/counterparties')} className="btn btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
