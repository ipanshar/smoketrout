import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  price: string;
  cost: string;
  is_active: boolean;
  type: { id: number; name: string };
  unit: { id: number; name: string; short_name: string };
}

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₽');

  useEffect(() => {
    loadProducts();
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const res = await api.get('/currencies');
      const defaultCurrency = res.data.find((c: { is_default: boolean }) => c.is_default);
      if (defaultCurrency) {
        setCurrencySymbol(defaultCurrency.symbol || defaultCurrency.code);
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/references/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await api.delete(`/references/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
        {hasPermission('references.products.create') && (
          <Link to="/references/products/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить
          </Link>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Название</th>
              <th className="table-header">Артикул</th>
              <th className="table-header">Тип</th>
              <th className="table-header">Ед. изм.</th>
              <th className="table-header">Цена</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{product.name}</td>
                <td className="table-cell text-gray-500">{product.sku || '—'}</td>
                <td className="table-cell">{product.type?.name}</td>
                <td className="table-cell">{product.unit?.short_name}</td>
                <td className="table-cell">{parseFloat(product.price).toLocaleString('ru-RU')} {currencySymbol}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.products.edit') && (
                      <Link to={`/references/products/${product.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.products.delete') && (
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">Товары не найдены</div>
        )}
      </div>
    </div>
  );
}
