import { useState, useEffect } from 'react';
import { Package, TrendingUp, Warehouse as WarehouseIcon } from 'lucide-react';
import api from '../../lib/api';

interface Warehouse {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  unit?: { short_name: string };
}

interface StockBalance {
  product: Product;
  quantity: number;
  avg_cost: number;
  total_value: number;
}

interface WarehouseStock {
  warehouse: Warehouse;
  items: StockBalance[];
  total_value: number;
}

interface StockMovement {
  id: number;
  quantity: number;
  price: number;
  product: Product;
  warehouse: Warehouse;
  warehouse_to?: Warehouse | null;
  transaction: {
    id: number;
    number: string;
    type: string;
    date: string;
    counterparty?: { name: string } | null;
  };
}

export default function StockPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [currencySymbol, setCurrencySymbol] = useState('₽');

  useEffect(() => {
    loadCurrency();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedWarehouse]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedWarehouse ? { warehouse_id: selectedWarehouse } : {};
      const [balancesRes, movementsRes] = await Promise.all([
        api.get('/accounting/stock/balances', { params }),
        api.get('/accounting/stock/movements', { params }),
      ]);
      setStock(balancesRes.data);
      setMovements(movementsRes.data.data);

      // Extract unique warehouses
      const warehouseMap = new Map<number, Warehouse>();
      balancesRes.data.forEach((s: WarehouseStock) => {
        warehouseMap.set(s.warehouse.id, s.warehouse);
      });
      setWarehouses(Array.from(warehouseMap.values()));
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: 'Продажа',
      purchase: 'Покупка',
      transfer: 'Перемещение',
      writeoff: 'Списание',
    };
    return labels[type] || type;
  };

  const totalValue = stock.reduce((acc, s) => acc + s.total_value, 0);

  return (
    <div>
      <h1 className="page-title mb-6">Склад</h1>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Товаров на складах</div>
                  <div className="text-xl font-bold">
                    {stock.reduce((acc, s) => acc + s.items.length, 0)} позиций
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <WarehouseIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Складов</div>
                  <div className="text-xl font-bold">{stock.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Общая стоимость</div>
                  <div className="text-xl font-bold">{totalValue.toLocaleString('ru')} {currencySymbol}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Склад</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : '')}
                  className="input w-full sm:w-64"
                >
                  <option value="">Все склады</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm ${
                    activeTab === 'balances' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Остатки
                </button>
                <button
                  onClick={() => setActiveTab('movements')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm ${
                    activeTab === 'movements' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Движения
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'balances' ? (
            <div className="space-y-6">
              {stock.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  Нет остатков на складах
                </div>
              ) : (
                stock.map((s) => (
                  <div key={s.warehouse.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h2 className="font-semibold">{s.warehouse.name}</h2>
                      <span className="text-sm text-gray-600">
                        Стоимость: <span className="font-medium">{s.total_value.toLocaleString('ru')} {currencySymbol}</span>
                      </span>
                    </div>

                    {/* Mobile Cards View for Stock Items */}
                    <div className="block md:hidden divide-y divide-gray-200">
                      {s.items.map((item, index) => (
                        <div key={index} className="p-4">
                          <div className="font-medium text-gray-900 mb-2">{item.product.name}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Кол-во:</span>{' '}
                              <span className="font-medium">{Number(item.quantity).toLocaleString('ru')} {item.product.unit?.short_name || 'шт'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Ср. цена:</span>{' '}
                              <span>{Number(item.avg_cost).toLocaleString('ru')} {currencySymbol}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Стоимость:</span>{' '}
                              <span className="font-medium">{item.total_value.toLocaleString('ru')} {currencySymbol}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View for Stock Items */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Товар</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Количество</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ср. цена</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Стоимость</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {s.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{item.product.name}</td>
                              <td className="px-4 py-3 text-right">
                                {Number(item.quantity).toLocaleString('ru')} {item.product.unit?.short_name || 'шт'}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {Number(item.avg_cost).toLocaleString('ru')} {currencySymbol}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {item.total_value.toLocaleString('ru')} {currencySymbol}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold">История движений</h2>
              </div>

              {movements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет движений</div>
              ) : (
                <>
                  {/* Mobile Cards View for Movements */}
                  <div className="block md:hidden divide-y divide-gray-200">
                    {movements.map((m) => (
                      <div key={m.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary-600 font-medium">{m.transaction.number}</span>
                          <span className={`font-medium ${Number(m.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(m.quantity) >= 0 ? '+' : ''}{Number(m.quantity).toLocaleString('ru')}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Дата:</span>
                            <span>{new Date(m.transaction.date).toLocaleDateString('ru')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Тип:</span>
                            <span>{getTypeLabel(m.transaction.type)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Товар:</span>
                            <span className="text-right">{m.product.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Склад:</span>
                            <span>
                              {m.warehouse.name}
                              {m.warehouse_to && <span className="text-gray-400"> → {m.warehouse_to.name}</span>}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Цена:</span>
                            <span>{Number(m.price).toLocaleString('ru')} {currencySymbol}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View for Movements */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Дата</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Документ</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Товар</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Склад</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Кол-во</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Цена</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {movements.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(m.transaction.date).toLocaleDateString('ru')}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-primary-600 font-medium">{m.transaction.number}</span>
                            </td>
                            <td className="px-4 py-3">{getTypeLabel(m.transaction.type)}</td>
                            <td className="px-4 py-3 font-medium">{m.product.name}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {m.warehouse.name}
                              {m.warehouse_to && (
                                <span className="text-gray-400"> → {m.warehouse_to.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-medium ${Number(m.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(m.quantity) >= 0 ? '+' : ''}{Number(m.quantity).toLocaleString('ru')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {Number(m.price).toLocaleString('ru')} {currencySymbol}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
