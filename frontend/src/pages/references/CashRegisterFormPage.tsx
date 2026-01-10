import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
}

interface FormData {
  name: string;
  code: string;
  type: string;
  currency_id: string;
  balance: string;
  description: string;
  is_active: boolean;
}

export default function CashRegisterFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    type: 'cash',
    currency_id: '',
    balance: '0',
    description: '',
    is_active: true,
  });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCurrencies();
    if (isEditing) {
      loadCashRegister();
    }
  }, [id]);

  const loadCurrencies = async () => {
    try {
      const response = await api.get('/references/currencies?active=true');
      setCurrencies(response.data.data);
      // Устанавливаем валюту по умолчанию
      if (!isEditing && response.data.data.length > 0) {
        const defaultCurrency = response.data.data.find((c: Currency) => c.code === 'RUB') || response.data.data[0];
        setFormData((prev) => ({ ...prev, currency_id: defaultCurrency.id.toString() }));
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const loadCashRegister = async () => {
    try {
      const response = await api.get(`/references/cash-registers/${id}`);
      const r = response.data;
      setFormData({
        name: r.name,
        code: r.code,
        type: r.type,
        currency_id: r.currency_id?.toString() || '',
        balance: r.balance,
        description: r.description || '',
        is_active: r.is_active,
      });
    } catch (error) {
      navigate('/references/cash-registers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        currency_id: parseInt(formData.currency_id),
        balance: parseFloat(formData.balance),
      };

      if (isEditing) {
        await api.put(`/references/cash-registers/${id}`, payload);
      } else {
        await api.post('/references/cash-registers', payload);
      }
      navigate('/references/cash-registers');
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
        {isEditing ? 'Редактирование кассы' : 'Новая касса'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Основная касса"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Код</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
              placeholder="main"
              disabled={isEditing}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              <option value="cash">Наличные</option>
              <option value="bank">Банк</option>
              <option value="online">Онлайн</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Начальный баланс</label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
            <select
              value={formData.currency_id}
              onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
              className="input"
            >
              <option value="">Выберите валюту</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
            {errors.currency_id && <p className="text-red-500 text-sm mt-1">{errors.currency_id}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          <label htmlFor="is_active" className="text-sm text-gray-700">Активна</label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => navigate('/references/cash-registers')} className="btn btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
