import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Plus, Edit, Trash2, Search, Shield } from 'lucide-react';
import { formatDistanceToNow } from '../../lib/utils';

interface Role {
  id: number;
  name: string;
  display_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role_id: number | null;
  role: Role | null;
  last_activity_at: string | null;
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<{ userId: number; roleId: number | null } | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/users/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      if (search) params.append('search', search);
      if (roleFilter) params.append('role_id', roleFilter);

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      setDeleteId(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleRoleChange = async (userId: number, roleId: number | null) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role_id: roleId });
      setUsers(
        users.map((u) =>
          u.id === userId
            ? { ...u, role_id: roleId, role: roles.find((r) => r.id === roleId) || null }
            : u
        )
      );
      setEditingRole(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка назначения роли');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Управление пользователями системы</p>
        </div>
        <Link to="/admin/users/create" className="btn btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="sm:inline">Добавить</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Все роли</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block md:hidden divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/admin/users/${user.id}/edit`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingRole?.userId === user.id ? (
                      <select
                        value={editingRole.roleId || ''}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value ? Number(e.target.value) : null)
                        }
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        className="input py-1 text-sm"
                      >
                        <option value="">Без роли</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.display_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingRole({ userId: user.id, roleId: user.role_id })}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                      >
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span>{user.role?.display_name || 'Без роли'}</span>
                      </button>
                    )}
                    <span className="text-xs text-gray-500">
                      {user.last_activity_at
                        ? formatDistanceToNow(user.last_activity_at)
                        : 'Никогда'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Пользователь</th>
                  <th className="table-header">Роль</th>
                  <th className="table-header">Последняя активность</th>
                  <th className="table-header text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {editingRole?.userId === user.id ? (
                        <select
                          value={editingRole.roleId || ''}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value ? Number(e.target.value) : null)
                          }
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          className="input py-1"
                        >
                          <option value="">Без роли</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.display_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRole({ userId: user.id, roleId: user.role_id })}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            {user.role?.display_name || 'Без роли'}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-600">
                        {user.last_activity_at
                          ? formatDistanceToNow(user.last_activity_at)
                          : 'Никогда'}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/users/${user.id}/edit`}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Показано {users.length} из {pagination.total}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => loadUsers(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pagination.current_page
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить пользователя?</h3>
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
