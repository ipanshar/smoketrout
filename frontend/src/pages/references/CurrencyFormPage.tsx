import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

interface FormData {
  name: string;
  code: string;
  symbol: string;
  exchange_rate: string;
  is_default: boolean;
  is_active: boolean;
}

export default function CurrencyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    symbol: '',
    exchange_rate: '1',
    is_default: false,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadCurrency();
    }
  }, [id]);

  const loadCurrency = async () => {
    try {
      const response = await api.get(`/references/currencies/${id}`);
      const c = response.data;
      setFormData({
        name: c.name,
        code: c.code,
        symbol: c.symbol || '',
        exchange_rate: c.exchange_rate,
        is_default: c.is_default,
        is_active: c.is_active,
      });
    } catch (error) {
      navigate('/references/currencies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        exchange_rate: parseFloat(formData.exchange_rate),
      };

      if (isEditing) {
        await api.put(`/references/currencies/${id}`, payload);
      } else {
        await api.post('/references/currencies', payload);
      }
      navigate('/references/currencies');
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
        {isEditing ? 'Редактирование валюты' : 'Новая валюта'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Российский рубль"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Код (ISO)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input"
              placeholder="RUB"
              maxLength={3}
              disabled={isEditing}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Символ</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="input"
              placeholder="₽"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Курс к базовой валюте</label>
          <input
            type="number"
            step="0.000001"
            value={formData.exchange_rate}
            onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
            className="input"
          />
          <p className="text-gray-500 text-sm mt-1">Для базовой валюты (RUB) курс = 1</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">По умолчанию</label>
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
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => navigate('/references/currencies')} className="btn btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
