import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

interface FormData {
  name: string;
  code: string;
  is_active: boolean;
}

export default function ProductTypeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadType();
    }
  }, [id]);

  const loadType = async () => {
    try {
      const response = await api.get(`/references/product-types/${id}`);
      setFormData(response.data);
    } catch (error) {
      navigate('/references/product-types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isEditing) {
        await api.put(`/references/product-types/${id}`, formData);
      } else {
        await api.post('/references/product-types', formData);
      }
      navigate('/references/product-types');
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
        {isEditing ? 'Редактирование типа товара' : 'Новый тип товара'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Готовая продукция"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Код</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="input"
            placeholder="finished"
            disabled={isEditing}
          />
          {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
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
          <button type="button" onClick={() => navigate('/references/product-types')} className="btn btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
