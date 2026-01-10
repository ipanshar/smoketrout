import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, RefreshCw, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

interface Product {
  id: number;
  name: string;
  unit?: { short_name: string };
}

interface Warehouse {
  id: number;
  name: string;
}

interface Recipe {
  id: number;
  name: string;
  code: string;
}

interface IngredientLine {
  product_id: number;
  warehouse_id: number;
  planned_quantity: string;
  actual_quantity: string;
  product?: Product;
}

interface OutputLine {
  product_id: number;
  planned_quantity: string;
  actual_quantity: string;
  product?: Product;
}

export default function ProductionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    recipe_id: 0,
    date: new Date().toISOString().split('T')[0],
    output_warehouse_id: 0,
    batch_count: '1',
    notes: '',
  });

  const [ingredients, setIngredients] = useState<IngredientLine[]>([]);
  const [outputs, setOutputs] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recipesRes, warehousesRes, productsRes] = await Promise.all([
        api.get('/production/recipes?is_active=true'),
        api.get('/references/warehouses'),
        api.get('/references/products'),
      ]);
      setRecipes(Array.isArray(recipesRes.data) ? recipesRes.data : recipesRes.data.data || []);
      setWarehouses(Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data.data || []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.data || []);

      if (isEdit) {
        const response = await api.get(`/production/productions/${id}`);
        const prod = response.data;
        setFormData({
          recipe_id: prod.recipe_id,
          date: prod.date,
          output_warehouse_id: prod.output_warehouse_id,
          batch_count: String(prod.batch_count),
          notes: prod.notes || '',
        });
        setIngredients(
          prod.ingredients.map((i: any) => ({
            product_id: i.product_id,
            warehouse_id: i.warehouse_id,
            planned_quantity: String(i.planned_quantity),
            actual_quantity: String(i.actual_quantity),
            product: i.product,
          }))
        );
        setOutputs(
          prod.outputs.map((o: any) => ({
            product_id: o.product_id,
            planned_quantity: String(o.planned_quantity),
            actual_quantity: String(o.actual_quantity),
            product: o.product,
          }))
        );
        setStatus(prod.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeChange = async (recipeId: number) => {
    setFormData({ ...formData, recipe_id: recipeId });
    if (recipeId && !isEdit) {
      await calculateFromRecipe(recipeId, parseFloat(formData.batch_count) || 1);
    }
  };

  const handleBatchCountChange = async (value: string) => {
    setFormData({ ...formData, batch_count: value });
    const batchCount = parseFloat(value) || 1;
    if (formData.recipe_id && !isEdit) {
      await calculateFromRecipe(formData.recipe_id, batchCount);
    }
  };

  const calculateFromRecipe = async (recipeId: number, batchCount: number) => {
    try {
      const response = await api.post('/production/productions/calculate', {
        recipe_id: recipeId,
        batch_count: batchCount,
      });
      const data = response.data;

      setIngredients(
        data.ingredients.map((i: any) => ({
          product_id: i.product_id,
          warehouse_id: formData.output_warehouse_id || (warehouses[0]?.id ?? 0),
          planned_quantity: String(i.planned_quantity),
          actual_quantity: String(i.planned_quantity),
          product: i.product,
        }))
      );
      setOutputs(
        data.outputs.map((o: any) => ({
          product_id: o.product_id,
          planned_quantity: String(o.planned_quantity),
          actual_quantity: String(o.planned_quantity),
          product: o.product,
        }))
      );
    } catch (error) {
      console.error('Error calculating:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      recipe_id: formData.recipe_id,
      date: formData.date,
      output_warehouse_id: formData.output_warehouse_id,
      batch_count: parseFloat(formData.batch_count) || 1,
      notes: formData.notes,
      ingredients: ingredients.map((i) => ({
        product_id: i.product_id,
        warehouse_id: i.warehouse_id,
        planned_quantity: parseFloat(i.planned_quantity) || 0,
        actual_quantity: parseFloat(i.actual_quantity) || 0,
      })),
      outputs: outputs.map((o) => ({
        product_id: o.product_id,
        planned_quantity: parseFloat(o.planned_quantity) || 0,
        actual_quantity: parseFloat(o.actual_quantity) || 0,
      })),
    };

    try {
      if (isEdit) {
        await api.put(`/production/productions/${id}`, data);
      } else {
        await api.post('/production/productions', data);
      }
      navigate('/production/productions');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const updateIngredient = (index: number, field: keyof IngredientLine, value: any) => {
    setIngredients(
      ingredients.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
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

  const isReadOnly = status !== 'draft';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/production/productions')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Редактирование производства' : 'Новое производство'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основные данные */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Основные данные</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Рецепт *
              </label>
              <select
                value={formData.recipe_id}
                onChange={(e) => handleRecipeChange(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                required
                disabled={isReadOnly}
              >
                <option value={0}>Выберите рецепт</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Склад готовой продукции *
              </label>
              <select
                value={formData.output_warehouse_id}
                onChange={(e) => setFormData({ ...formData, output_warehouse_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
                disabled={isReadOnly}
              >
                <option value={0}>Выберите склад</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество партий
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={formData.batch_count}
                  onChange={(e) => handleBatchCountChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  disabled={isReadOnly}
                />
                {!isEdit && formData.recipe_id > 0 && (
                  <button
                    type="button"
                    onClick={() => calculateFromRecipe(formData.recipe_id, parseFloat(formData.batch_count) || 1)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Пересчитать"
                  >
                    <RefreshCw size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечание
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Ингредиенты */}
        {ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Ингредиенты</h2>
            <table className="w-full">
              <thead className="border-b text-left text-sm text-gray-500">
                <tr>
                  <th className="pb-2">Товар</th>
                  <th className="pb-2">Склад</th>
                  <th className="pb-2 text-right w-28">План</th>
                  <th className="pb-2 text-right w-28">Факт</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ingredients.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2">
                      {item.product?.name || products.find(p => p.id === item.product_id)?.name}
                    </td>
                    <td className="py-2">
                      <select
                        value={item.warehouse_id}
                        onChange={(e) => updateIngredient(index, 'warehouse_id', Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded"
                        disabled={isReadOnly}
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 text-right text-gray-500">
                      {item.planned_quantity}
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={item.actual_quantity}
                        onChange={(e) => updateIngredient(index, 'actual_quantity', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Выход */}
        {outputs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Готовая продукция</h2>
            <table className="w-full">
              <thead className="border-b text-left text-sm text-gray-500">
                <tr>
                  <th className="pb-2">Товар</th>
                  <th className="pb-2 text-right w-28">План</th>
                  <th className="pb-2 text-right w-28">Факт</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outputs.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 text-green-700">
                      {item.product?.name || products.find(p => p.id === item.product_id)?.name}
                    </td>
                    <td className="py-2 text-right text-gray-500">
                      {item.planned_quantity}
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={item.actual_quantity}
                        onChange={(e) => updateOutput(index, 'actual_quantity', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Кнопки */}
        {!isReadOnly && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/production/productions')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
