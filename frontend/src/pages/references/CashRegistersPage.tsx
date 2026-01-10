import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CashRegister {
  id: number;
  name: string;
  code: string;
  type: 'cash' | 'bank' | 'online';
  balance: string;
  currency: { id: number; code: string; symbol: string } | null;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'Наличные',
  bank: 'Банк',
  online: 'Онлайн',
};

export default function CashRegistersPage() {
  const { hasPermission } = useAuth();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    try {
      const response = await api.get('/references/cash-registers');
      setRegisters(response.data.data);
    } catch (error) {
      console.error('Failed to load cash registers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить кассу?')) return;
    try {
      await api.delete(`/references/cash-registers/${id}`);
      setRegisters(registers.filter((r) => r.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredRegisters = registers.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Кассы</h1>
        {hasPermission('references.cash_registers.create') && (
          <Link to="/references/cash-registers/new" className="btn btn-primary flex items-center gap-2">
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
            placeholder="Поиск..."
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
              <th className="table-header">Код</th>
              <th className="table-header">Тип</th>
              <th className="table-header">Баланс</th>
              <th className="table-header">Статус</th>
              <th className="table-header w-24">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRegisters.map((register) => (
              <tr key={register.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{register.name}</td>
                <td className="table-cell text-gray-500">{register.code}</td>
                <td className="table-cell">{TYPE_LABELS[register.type]}</td>
                <td className="table-cell font-medium">
                  {parseFloat(register.balance).toLocaleString('ru-RU')} {register.currency?.symbol || register.currency?.code || ''}
                </td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs ${register.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {register.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {hasPermission('references.cash_registers.edit') && (
                      <Link to={`/references/cash-registers/${register.id}`} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.cash_registers.delete') && (
                      <button onClick={() => handleDelete(register.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRegisters.length === 0 && (
          <div className="text-center py-8 text-gray-500">Кассы не найдены</div>
        )}
      </div>
    </div>
  );
}
