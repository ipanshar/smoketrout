import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

interface Product {
  id: number;
  name: string;
  unit?: { short_name: string };
}

interface IngredientLine {
  product_id: number;
  quantity: string;
}

interface OutputLine {
  product_id: number;
  quantity: string;
}

export default function RecipeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  const [ingredients, setIngredients] = useState<IngredientLine[]>([
    { product_id: 0, quantity: '' }
  ]);

  const [outputs, setOutputs] = useState<OutputLine[]>([
    { product_id: 0, quantity: '' }
  ]);

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadRecipe();
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/references/products');
      setProducts(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRecipe = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/production/recipes/${id}`);
      const recipe = response.data;
      setFormData({
        name: recipe.name,
        code: recipe.code || '',
        description: recipe.description || '',
        is_active: recipe.is_active,
      });
      setIngredients(
        recipe.ingredients.map((i: any) => ({
          product_id: i.product_id,
          quantity: String(i.quantity),
        }))
      );
      setOutputs(
        recipe.outputs.map((o: any) => ({
          product_id: o.product_id,
          quantity: String(o.quantity),
        }))
      );
    } catch (error) {
      console.error('Error loading recipe:', error);
      navigate('/production/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      ...formData,
      ingredients: ingredients
        .filter((i) => i.product_id && i.quantity)
        .map((i) => ({ product_id: i.product_id, quantity: parseFloat(i.quantity) })),
      outputs: outputs
        .filter((o) => o.product_id && o.quantity)
        .map((o) => ({ product_id: o.product_id, quantity: parseFloat(o.quantity) })),
    };

    try {
      if (isEdit) {
        await api.put(`/production/recipes/${id}`, data);
      } else {
        await api.post('/production/recipes', data);
      }
      navigate('/production/recipes');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { product_id: 0, quantity: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientLine, value: any) => {
    setIngredients(
      ingredients.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addOutput = () => {
    setOutputs([...outputs, { product_id: 0, quantity: '' }]);
  };

  const removeOutput = (index: number) => {
    setOutputs(outputs.filter((_, i) => i !== index));
  };

  const updateOutput = (index: number, field: keyof OutputLine, value: any) => {
    setOutputs(
      outputs.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/production/recipes')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold">
          {isEdit ? 'Редактирование рецепта' : 'Новый рецепт'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основные данные */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Основные данные</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Код
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Авто"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Активен
              </label>
            </div>
          </div>
        </div>

        {/* Ингредиенты */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Ингредиенты (на 1 партию)</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
          <div className="space-y-3">
            {ingredients.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={item.product_id}
                  onChange={(e) => updateIngredient(index, 'product_id', Number(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Выберите товар</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit?.short_name || 'шт'})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Кол-во"
                    value={item.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    className="flex-1 sm:w-32 px-3 py-2 border rounded-lg"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Выход */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Выход готовой продукции</h2>
            <button
              type="button"
              onClick={addOutput}
              className="flex items-center gap-1 text-green-600 hover:text-green-700"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
          <div className="space-y-3">
            {outputs.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={item.product_id}
                  onChange={(e) => updateOutput(index, 'product_id', Number(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Выберите товар</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit?.short_name || 'шт'})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Кол-во"
                    value={item.quantity}
                    onChange={(e) => updateOutput(index, 'quantity', e.target.value)}
                    className="flex-1 sm:w-32 px-3 py-2 border rounded-lg"
                  />
                  {outputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutput(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/production/recipes')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 order-2 sm:order-1"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
          >
            <Save size={18} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
