import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import api from '../../lib/api';

interface Product {
  id: number;
  name: string;
  unit?: { short_name: string };
}

interface RecipeIngredient {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
}

interface RecipeOutput {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
}

interface Recipe {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  ingredients: RecipeIngredient[];
  outputs: RecipeOutput[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadRecipes();
  }, [search]);

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await api.get(`/production/recipes?${params}`);
      setRecipes(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить рецепт?')) return;
    try {
      await api.delete(`/production/recipes/${id}`);
      loadRecipes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при удалении');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Рецепты</h1>
        <Link
          to="/production/recipes/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Добавить
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по названию или коду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {recipes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет рецептов</div>
        ) : (
          <div className="divide-y">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="hover:bg-gray-50">
                <div
                  className="p-4 flex items-center cursor-pointer"
                  onClick={() => toggleExpand(recipe.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">{recipe.code}</span>
                      <span className="text-gray-800">{recipe.name}</span>
                      {!recipe.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                          Неактивен
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {recipe.ingredients.length} ингр. → {recipe.outputs.length} выход
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/production/recipes/${recipe.id}`}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(recipe.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                    {expandedId === recipe.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedId === recipe.id && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Ингредиенты */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Ингредиенты (на 1 партию)</h4>
                        <div className="space-y-1">
                          {recipe.ingredients.map((ing) => (
                            <div key={ing.id} className="flex justify-between text-sm">
                              <span>{ing.product.name}</span>
                              <span className="text-gray-600">
                                {ing.quantity} {ing.product.unit?.short_name || 'шт'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Выход */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Выход готовой продукции</h4>
                        <div className="space-y-1">
                          {recipe.outputs.map((out) => (
                            <div key={out.id} className="flex justify-between text-sm">
                              <span className="text-green-700">{out.product.name}</span>
                              <span className="text-green-600 font-medium">
                                {out.quantity} {out.product.unit?.short_name || 'шт'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {recipe.description && (
                      <div className="mt-3 text-sm text-gray-500">{recipe.description}</div>
                    )}
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
