import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

interface ProductType {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  short_name: string;
}

interface FormData {
  type_id: string;
  unit_id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  price: string;
  cost: string;
  min_stock: string;
  is_active: boolean;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    type_id: '',
    unit_id: '',
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: '0',
    cost: '0',
    min_stock: '0',
    is_active: true,
  });
  const [types, setTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSelects();
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadSelects = async () => {
    try {
      const [typesRes, unitsRes] = await Promise.all([
        api.get('/references/product-types?active=true'),
        api.get('/references/units?active=true'),
      ]);
      setTypes(typesRes.data.data);
      setUnits(unitsRes.data.data);
    } catch (error) {
      console.error('Failed to load selects:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await api.get(`/references/products/${id}`);
      const p = response.data;
      setFormData({
        type_id: p.type_id?.toString() || '',
        unit_id: p.unit_id?.toString() || '',
        name: p.name,
        sku: p.sku || '',
        barcode: p.barcode || '',
        description: p.description || '',
        price: p.price,
        cost: p.cost,
        min_stock: p.min_stock,
        is_active: p.is_active,
      });
    } catch (error) {
      navigate('/references/products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        type_id: parseInt(formData.type_id),
        unit_id: parseInt(formData.unit_id),
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        min_stock: parseFloat(formData.min_stock),
      };

      if (isEditing) {
        await api.put(`/references/products/${id}`, payload);
      } else {
        await api.post('/references/products', payload);
      }
      navigate('/references/products');
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
        {isEditing ? 'Редактирование товара' : 'Новый товар'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип товара</label>
            <select
              value={formData.type_id}
              onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
              className="input"
            >
              <option value="">Выберите тип</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.type_id && <p className="text-red-500 text-sm mt-1">{errors.type_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Единица измерения</label>
            <select
              value={formData.unit_id}
              onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
              className="input"
            >
              <option value="">Выберите единицу</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
              ))}
            </select>
            {errors.unit_id && <p className="text-red-500 text-sm mt-1">{errors.unit_id}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Форель копчёная"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Артикул</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="input"
              placeholder="FK-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Штрих-код</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Себестоимость</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Мин. остаток</label>
            <input
              type="number"
              step="0.001"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              className="input"
            />
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
          <label htmlFor="is_active" className="text-sm text-gray-700">Активен</label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => navigate('/references/products')} className="btn btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
