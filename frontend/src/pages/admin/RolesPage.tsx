import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  users_count: number;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.roles);
      setModules(response.data.modules);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/roles/${id}`);
      setRoles(roles.filter((r) => r.id !== id));
      setDeleteId(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const getModuleNames = (permissions: Permission[]) => {
    const moduleKeys = [...new Set(permissions.map((p) => p.module))];
    return moduleKeys.map((key) => modules[key] || key).join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Роли</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Управление ролями и разрешениями</p>
        </div>
        <Link to="/admin/roles/create" className="btn btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Создать роль</span>
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="block md:hidden divide-y divide-gray-200">
          {roles.map((role) => (
            <div key={role.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{role.display_name}</p>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/admin/roles/${role.id}/edit`}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  {!role.is_system && (
                    <button
                      onClick={() => setDeleteId(role.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{role.users_count} пользователей</span>
                </div>
                <p className="text-gray-500 text-xs">
                  {getModuleNames(role.permissions) || 'Нет доступа'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Роль</th>
              <th className="table-header">Доступ к модулям</th>
              <th className="table-header">Пользователей</th>
              <th className="table-header text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{role.display_name}</p>
                      <p className="text-sm text-gray-500">{role.name}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <p className="text-gray-600 max-w-xs truncate">
                    {getModuleNames(role.permissions) || 'Нет доступа'}
                  </p>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{role.users_count}</span>
                  </div>
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/roles/${role.id}/edit`}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    {!role.is_system && (
                      <button
                        onClick={() => setDeleteId(role.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить роль?</h3>
            <p className="text-gray-600 mb-6">Это действие нельзя отменить.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">
                Отмена
              </button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
