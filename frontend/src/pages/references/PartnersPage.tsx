import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  code: string;
  share_percentage: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export default function PartnersPage() {
  const { hasPermission } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [totalShare, setTotalShare] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await api.get('/references/partners');
      setPartners(response.data.data);
      setTotalShare(response.data.total_share);
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого компаньона?')) return;
    
    try {
      await api.delete(`/references/partners/${id}`);
      setPartners(partners.filter(p => p.id !== id));
      loadPartners(); // Reload to update total share
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при удалении');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Компаньоны</h1>
          <p className="text-sm text-gray-500 mt-1">
            Общая доля: <span className={totalShare > 100 ? 'text-red-600 font-bold' : 'text-green-600 font-semibold'}>{totalShare}%</span>
            {totalShare < 100 && <span className="text-gray-400"> (доступно: {(100 - totalShare).toFixed(2)}%)</span>}
          </p>
        </div>
        {hasPermission('references.partners.create') && (
          <Link
            to="/references/partners/new"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Добавить
          </Link>
        )}
      </div>

      {/* Progress bar showing total share */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Распределение долей</span>
          <span className="font-medium">{totalShare}% из 100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all ${totalShare > 100 ? 'bg-red-500' : totalShare === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(totalShare, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-3">
        {partners.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Нет компаньонов</p>
          </div>
        ) : (
          partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-900">{partner.name}</div>
                  <div className="text-sm text-gray-500">{partner.code}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  partner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {partner.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-blue-600">
                    {parseFloat(partner.share_percentage).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${parseFloat(partner.share_percentage)}%` }}
                  ></div>
                </div>
              </div>

              {(partner.phone || partner.email) && (
                <div className="text-sm text-gray-500 mb-3">
                  {partner.phone && <div>{partner.phone}</div>}
                  {partner.email && <div>{partner.email}</div>}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                {hasPermission('references.partners.edit') && (
                  <Link
                    to={`/references/partners/${partner.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Изменить
                  </Link>
                )}
                {hasPermission('references.partners.delete') && (
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Компаньон</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Доля</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Контакты</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет компаньонов</p>
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500">{partner.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${parseFloat(partner.share_percentage)}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-semibold text-blue-600">
                        {parseFloat(partner.share_percentage).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {partner.phone && <div>{partner.phone}</div>}
                    {partner.email && <div>{partner.email}</div>}
                    {!partner.phone && !partner.email && '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      partner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {hasPermission('references.partners.edit') && (
                      <Link
                        to={`/references/partners/${partner.id}`}
                        className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('references.partners.delete') && (
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
