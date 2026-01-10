import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

interface TransactionType {
  value: string;
  label: string;
}

interface Counterparty {
  id: number;
  name: string;
}

interface Partner {
  id: number;
  name: string;
  share_percentage: number;
}

interface CashRegister {
  id: number;
  name: string;
  currency_id: number;
  currency?: { id: number; code: string; symbol: string };
}

interface Warehouse {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  unit?: { id: number; short_name: string };
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_default?: boolean;
}

interface TransactionItem {
  product_id: number;
  warehouse_id: number;
  warehouse_to_id?: number;
  quantity: number;
  price: number;
}

interface CashEntry {
  cash_register_id: number;
  currency_id: number;
  amount: number;
}

interface DividendEntry {
  partner_id: number;
  currency_id: number;
  type: 'accrual' | 'payment';
  amount: number;
}

interface SalaryEntry {
  user_id: number;
  currency_id: number;
  type: 'accrual' | 'payment';
  amount: number;
}

interface User {
  id: number;
  name: string;
}

export default function TransactionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [type, setType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [counterpartyId, setCounterpartyId] = useState<number | ''>('');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [currencyId, setCurrencyId] = useState<number>(1);
  const [status, setStatus] = useState('draft');

  // Items
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [dividendEntries, setDividendEntries] = useState<DividendEntry[]>([]);
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);

  // Dictionaries
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadDictionaries();
    if (isEdit) loadTransaction();
  }, [id]);

  // Recalculate total when items change (for sale/purchase)
  useEffect(() => {
    const hasItems = ['sale', 'purchase', 'transfer'].includes(type);
    if (hasItems) {
      const sum = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      setTotalAmount(sum);
    }
  }, [items, type]);

  // Recalculate total when cash entries change (for payment operations)
  useEffect(() => {
    const isPaymentOperation = ['sale_payment', 'purchase_payment'].includes(type);
    if (isPaymentOperation) {
      const sum = cashEntries.reduce((acc, entry) => acc + Math.abs(entry.amount), 0);
      setTotalAmount(sum);
    }
  }, [cashEntries, type]);

  // Recalculate total when salary entries change
  useEffect(() => {
    const isSalaryOperation = ['salary_accrual', 'salary_payment'].includes(type);
    if (isSalaryOperation) {
      const sum = salaryEntries.reduce((acc, entry) => acc + entry.amount, 0);
      setTotalAmount(sum);
      
      // Для выплаты зарплаты синхронизируем сумму с кассой
      if (type === 'salary_payment' && cashEntries.length > 0 && sum > 0) {
        // Обновляем сумму первой кассовой записи только если она отличается
        if (cashEntries[0].amount !== sum) {
          const updated = [...cashEntries];
          updated[0] = { ...updated[0], amount: sum };
          setCashEntries(updated);
        }
      }
    }
  }, [salaryEntries, type]);

  // Recalculate total when dividend entries change
  useEffect(() => {
    const isDividendOperation = ['dividend_accrual', 'dividend_payment'].includes(type);
    if (isDividendOperation && dividendEntries.length > 0) {
      const sum = dividendEntries.reduce((acc, entry) => acc + entry.amount, 0);
      setTotalAmount(sum);
      
      // Для выплаты дивидендов синхронизируем сумму с кассой
      if (type === 'dividend_payment' && cashEntries.length > 0 && sum > 0) {
        if (cashEntries[0].amount !== sum) {
          const updated = [...cashEntries];
          updated[0] = { ...updated[0], amount: sum };
          setCashEntries(updated);
        }
      }
    }
  }, [dividendEntries, type]);

  const loadDictionaries = async () => {
    try {
      const [typesRes, counterpartiesRes, partnersRes, usersRes, cashRegistersRes, warehousesRes, productsRes, currenciesRes] = await Promise.all([
        api.get('/accounting/transactions/types'),
        api.get('/references/counterparties'),
        api.get('/references/partners'),
        api.get('/admin/users'),
        api.get('/references/cash-registers'),
        api.get('/references/warehouses'),
        api.get('/references/products'),
        api.get('/references/currencies'),
      ]);
      setTypes(typesRes.data);
      setCounterparties(counterpartiesRes.data.data || counterpartiesRes.data);
      setPartners(partnersRes.data.data || partnersRes.data);
      setUsers(usersRes.data.data || usersRes.data);
      setCashRegisters(cashRegistersRes.data.data || cashRegistersRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      
      const currenciesData = currenciesRes.data.data || currenciesRes.data;
      setCurrencies(currenciesData);
      
      // Устанавливаем валюту по умолчанию при создании новой транзакции
      if (!isEdit && currenciesData.length > 0) {
        const defaultCurrency = currenciesData.find((c: Currency) => c.is_default) || currenciesData[0];
        setCurrencyId(defaultCurrency.id);
      }
    } catch (error) {
      console.error('Error loading dictionaries:', error);
    }
  };

  const loadTransaction = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/accounting/transactions/${id}`);
      const t = response.data;
      setType(t.type);
      setDate(t.date);
      setCounterpartyId(t.counterparty_id || '');
      setPartnerId(t.partner_id || '');
      setDescription(t.description || '');
      setTotalAmount(Number(t.total_amount));
      setPaidAmount(Number(t.paid_amount));
      setStatus(t.status);
      
      // Устанавливаем валюту из загруженной транзакции
      if (t.currency_id) {
        setCurrencyId(t.currency_id);
      }

      if (t.items) {
        setItems(t.items.map((i: any) => ({
          product_id: i.product_id,
          warehouse_id: i.warehouse_id,
          warehouse_to_id: i.warehouse_to_id,
          quantity: Math.abs(Number(i.quantity)),
          price: Number(i.price),
        })));
      }

      if (t.cash_entries) {
        setCashEntries(t.cash_entries.map((e: any) => ({
          cash_register_id: e.cash_register_id,
          currency_id: e.currency_id,
          amount: Math.abs(Number(e.amount)),
        })));
      }

      if (t.dividend_entries) {
        setDividendEntries(t.dividend_entries.map((e: any) => ({
          partner_id: e.partner_id,
          currency_id: e.currency_id,
          type: e.type,
          amount: Number(e.amount),
        })));
      }

      if (t.salary_entries) {
        setSalaryEntries(t.salary_entries.map((e: any) => ({
          user_id: e.user_id,
          currency_id: e.currency_id,
          type: e.type,
          amount: Number(e.amount),
        })));
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      navigate('/accounting/transactions');
    } finally {
      setLoading(false);
    }
  };

  const needsCounterparty = ['sale', 'sale_payment', 'purchase', 'purchase_payment'].includes(type);
  const needsPartner = ['dividend_accrual', 'dividend_payment'].includes(type);
  const needsSalary = ['salary_accrual', 'salary_payment'].includes(type);
  const needsItems = ['sale', 'purchase', 'transfer'].includes(type);
  const needsCash = ['cash_in', 'cash_out', 'sale', 'sale_payment', 'purchase', 'purchase_payment', 'dividend_payment', 'salary_payment'].includes(type);
  const needsTransferWarehouses = type === 'transfer';
  const canHavePartialPayment = ['sale', 'purchase'].includes(type);

  // Получаем текущую валюту и фильтруем кассы по валюте
  const currentCurrency = currencies.find(c => c.id === currencyId);
  const currencySymbol = currentCurrency?.symbol || '₽';
  const filteredCashRegisters = cashRegisters.filter(cr => cr.currency_id === currencyId);

  // Обработчик смены валюты - очищаем кассовые записи с неподходящими кассами
  const handleCurrencyChange = (newCurrencyId: number) => {
    setCurrencyId(newCurrencyId);
    // Очищаем записи с неподходящими кассами
    setCashEntries(cashEntries.map(entry => {
      const cashReg = cashRegisters.find(cr => cr.id === entry.cash_register_id);
      if (cashReg && cashReg.currency_id !== newCurrencyId) {
        return { ...entry, cash_register_id: 0, currency_id: newCurrencyId };
      }
      return { ...entry, currency_id: newCurrencyId };
    }));
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, warehouse_id: 0, quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    
    // При выборе salary_payment или dividend_payment автоматически добавляем кассовую запись с первой доступной кассой
    if ((newType === 'salary_payment' || newType === 'dividend_payment') && cashEntries.length === 0) {
      const availableCashRegisters = cashRegisters.filter(cr => cr.currency_id === currencyId);
      const firstCashRegister = availableCashRegisters[0];
      setCashEntries([{ 
        cash_register_id: firstCashRegister?.id || 0, 
        currency_id: currencyId, 
        amount: 0 
      }]);
    }
    
    // При смене типа сбрасываем записи которые не нужны для нового типа
    const needsCashForType = ['cash_in', 'cash_out', 'sale', 'sale_payment', 'purchase', 'purchase_payment', 'dividend_payment', 'salary_payment'].includes(newType);
    if (!needsCashForType) {
      setCashEntries([]);
    }
    
    const needsSalaryForType = ['salary_accrual', 'salary_payment'].includes(newType);
    if (!needsSalaryForType) {
      setSalaryEntries([]);
    }
  };

  const addCashEntry = () => {
    const availableCashRegisters = cashRegisters.filter(cr => cr.currency_id === currencyId);
    const firstCashRegister = availableCashRegisters[0];
    setCashEntries([...cashEntries, { 
      cash_register_id: firstCashRegister?.id || 0, 
      currency_id: currencyId, 
      amount: 0 
    }]);
  };

  const removeCashEntry = (index: number) => {
    setCashEntries(cashEntries.filter((_, i) => i !== index));
  };

  const updateCashEntry = (index: number, field: keyof CashEntry, value: any) => {
    const updated = [...cashEntries];
    updated[index] = { ...updated[index], [field]: value };
    setCashEntries(updated);
  };

  const addSalaryEntry = () => {
    const salaryType = type === 'salary_accrual' ? 'accrual' : 'payment';
    setSalaryEntries([...salaryEntries, { user_id: 0, currency_id: currencyId, type: salaryType as 'accrual' | 'payment', amount: 0 }]);
  };

  const removeSalaryEntry = (index: number) => {
    setSalaryEntries(salaryEntries.filter((_, i) => i !== index));
  };

  const updateSalaryEntry = (index: number, field: keyof SalaryEntry, value: any) => {
    const updated = [...salaryEntries];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryEntries(updated);
  };

  const addDividendEntry = () => {
    const dividendType = type === 'dividend_accrual' ? 'accrual' : 'payment';
    setDividendEntries([...dividendEntries, { 
      partner_id: 0, 
      currency_id: currencyId, 
      type: dividendType as 'accrual' | 'payment', 
      amount: 0 
    }]);
  };

  const removeDividendEntry = (index: number) => {
    setDividendEntries(dividendEntries.filter((_, i) => i !== index));
  };

  const updateDividendEntry = (index: number, field: 'partner_id' | 'amount', value: number) => {
    const updated = [...dividendEntries];
    updated[index] = { ...updated[index], [field]: value };
    setDividendEntries(updated);
  };

  const calculateDividends = async () => {
    if (!totalAmount || totalAmount <= 0) {
      alert('Укажите сумму для распределения');
      return;
    }

    try {
      const response = await api.post('/accounting/dividends/calculate', {
        amount: totalAmount,
        currency_id: currencyId,
      });

      const distribution = response.data.distribution;
      const dividendType = type === 'dividend_accrual' ? 'accrual' : 'payment';

      setDividendEntries(distribution.map((d: any) => ({
        partner_id: d.partner.id,
        currency_id: currencyId,
        type: dividendType,
        amount: d.amount,
      })));
    } catch (error) {
      console.error('Error calculating dividends:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, shouldConfirm = false) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const data = {
      type,
      date,
      counterparty_id: counterpartyId || null,
      partner_id: partnerId || null,
      description,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      currency_id: currencyId,
      items: needsItems ? items.filter((i) => i.product_id) : undefined,
      cash_entries: needsCash ? cashEntries.filter((e) => e.cash_register_id).map((e) => ({
        ...e,
        amount: ['cash_out', 'purchase', 'purchase_payment', 'dividend_payment', 'salary_payment'].includes(type) ? -e.amount : e.amount,
      })) : undefined,
      dividend_entries: needsPartner ? dividendEntries.filter((e) => e.partner_id) : undefined,
      salary_entries: needsSalary ? salaryEntries.filter((e) => e.user_id) : undefined,
    };

    try {
      let savedId = id;
      if (isEdit) {
        await api.put(`/accounting/transactions/${id}`, data);
      } else {
        const response = await api.post('/accounting/transactions', data);
        savedId = response.data.id;
      }

      if (shouldConfirm && savedId) {
        await api.post(`/accounting/transactions/${savedId}/confirm`);
      }

      navigate('/accounting/transactions');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  }

  const isEditable = status === 'draft';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/accounting/transactions')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Редактирование документа' : 'Новый документ'}
        </h1>
        {status !== 'draft' && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status === 'confirmed' ? 'Проведён' : 'Отменён'}
          </span>
        )}
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Основные данные</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип операции *</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="input"
                disabled={!isEditable}
                required
              >
                <option value="">Выберите тип</option>
                {types.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                disabled={!isEditable}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
              <select
                value={currencyId}
                onChange={(e) => handleCurrencyChange(Number(e.target.value))}
                className="input"
                disabled={!isEditable}
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            {needsCounterparty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Контрагент</label>
                <select
                  value={counterpartyId}
                  onChange={(e) => setCounterpartyId(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  disabled={!isEditable}
                >
                  <option value="">Выберите контрагента</option>
                  {counterparties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {needsPartner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Компаньон</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  disabled={!isEditable}
                >
                  <option value="">Все компаньоны</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.share_percentage}%)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={2}
              disabled={!isEditable}
            />
          </div>
        </div>

        {/* Items (Товары) */}
        {needsItems && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Товары</h2>
              {isEditable && (
                <button type="button" onClick={addItem} className="btn-secondary flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Добавьте товары</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Товар</th>
                      <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">
                        {needsTransferWarehouses ? 'Откуда' : 'Склад'}
                      </th>
                      {needsTransferWarehouses && (
                        <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Куда</th>
                      )}
                      <th className="text-right px-3 py-2 text-sm font-medium text-gray-600">Кол-во</th>
                      <th className="text-right px-3 py-2 text-sm font-medium text-gray-600">Цена</th>
                      <th className="text-right px-3 py-2 text-sm font-medium text-gray-600">Сумма</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                            className="input"
                            disabled={!isEditable}
                          >
                            <option value={0}>Выберите товар</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.warehouse_id}
                            onChange={(e) => updateItem(index, 'warehouse_id', Number(e.target.value))}
                            className="input"
                            disabled={!isEditable}
                          >
                            <option value={0}>Выберите склад</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </td>
                        {needsTransferWarehouses && (
                          <td className="px-3 py-2">
                            <select
                              value={item.warehouse_to_id || 0}
                              onChange={(e) => updateItem(index, 'warehouse_to_id', Number(e.target.value) || undefined)}
                              className="input"
                              disabled={!isEditable}
                            >
                              <option value={0}>Выберите склад</option>
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            className="input text-right w-24"
                            step="0.001"
                            min="0.001"
                            disabled={!isEditable}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                            className="input text-right w-28"
                            step="0.01"
                            min="0"
                            disabled={!isEditable}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {(item.quantity * item.price).toLocaleString('ru')} {currencySymbol}
                        </td>
                        <td className="px-3 py-2">
                          {isEditable && (
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cash entries (Кассовые операции) */}
        {needsCash && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Кассовые операции</h2>
              {isEditable && (
                <button type="button" onClick={addCashEntry} className="btn-secondary flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              )}
            </div>

            {cashEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Добавьте кассовые операции</p>
            ) : (
              <div className="space-y-3">
                {cashEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <select
                      value={entry.cash_register_id}
                      onChange={(e) => updateCashEntry(index, 'cash_register_id', Number(e.target.value))}
                      className="input flex-1"
                      disabled={!isEditable}
                    >
                      <option value={0}>Выберите кассу ({currentCurrency?.code || 'выберите валюту'})</option>
                      {filteredCashRegisters.map((cr) => (
                        <option key={cr.id} value={cr.id}>{cr.name} ({cr.currency?.code})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateCashEntry(index, 'amount', Number(e.target.value))}
                      className="input w-40 text-right"
                      placeholder="Сумма"
                      step="0.01"
                      min="0"
                      disabled={!isEditable}
                    />
                    {isEditable && (
                      <button type="button" onClick={() => removeCashEntry(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dividend entries */}
        {needsPartner && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Распределение дивидендов</h2>
              {isEditable && (
                <div className="flex gap-2">
                  <button type="button" onClick={addDividendEntry} className="btn-secondary flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                  <button type="button" onClick={calculateDividends} className="btn-secondary">
                    Рассчитать по долям
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Сумма для распределения (для расчёта по долям)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="input w-48"
                step="0.01"
                min="0"
                disabled={!isEditable}
              />
            </div>

            {dividendEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Добавьте компаньонов для выплаты или рассчитайте по долям</p>
            ) : (
              <div className="space-y-3">
                {dividendEntries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={entry.partner_id}
                        onChange={(e) => updateDividendEntry(index, 'partner_id', Number(e.target.value))}
                        className="input flex-1"
                        disabled={!isEditable}
                      >
                        <option value={0}>Выберите компаньона</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.share_percentage}%)</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={entry.amount}
                        onChange={(e) => updateDividendEntry(index, 'amount', Number(e.target.value))}
                        className="input w-40 text-right"
                        placeholder="Сумма"
                        step="0.01"
                        min="0"
                        disabled={!isEditable}
                      />
                      <span className="text-gray-500">{currencySymbol}</span>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => removeDividendEntry(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                ))}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-lg font-semibold">
                    Итого: {dividendEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString('ru')} {currencySymbol}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salary entries */}
        {needsSalary && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {type === 'salary_accrual' ? 'Начисление зарплаты' : 'Выплата зарплаты'}
              </h2>
              {isEditable && (
                <button type="button" onClick={addSalaryEntry} className="btn-secondary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить сотрудника
                </button>
              )}
            </div>

            {salaryEntries.length > 0 && (
              <div className="space-y-3">
                {salaryEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={entry.user_id}
                      onChange={(e) => updateSalaryEntry(index, 'user_id', Number(e.target.value))}
                      className="input flex-1"
                      disabled={!isEditable}
                    >
                      <option value={0}>Выберите сотрудника</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateSalaryEntry(index, 'amount', Number(e.target.value))}
                      className="input w-40"
                      placeholder="Сумма"
                      step="0.01"
                      min="0"
                      disabled={!isEditable}
                    />
                    <span className="text-gray-500">{currencySymbol}</span>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => removeSalaryEntry(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-lg font-semibold">
                    Итого: {salaryEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString('ru')} {currencySymbol}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              {canHavePartialPayment && (
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Оплачено сейчас</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="input w-40"
                      step="0.01"
                      min="0"
                      max={totalAmount}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Долг: <span className="font-medium">{(totalAmount - paidAmount).toLocaleString('ru')} {currencySymbol}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Итого</div>
              <div className="text-2xl font-bold">{totalAmount.toLocaleString('ru')} {currencySymbol}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/accounting/transactions')} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Сохранить и провести
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
