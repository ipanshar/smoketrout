import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
}

interface FormData {
  name: string;
  display_name: string;
  description: string;
  permissions: number[];
}

export default function RoleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
  });
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [modules, setModules] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const permResponse = await api.get('/admin/permissions');
      setPermissions(permResponse.data.permissions);
      setModules(permResponse.data.modules);

      if (isEditing) {
        const roleResponse = await api.get(`/admin/roles/${id}`);
        const role = roleResponse.data.role;
        setFormData({
          name: role.name,
          display_name: role.display_name,
          description: role.description || '',
          permissions: role.permissions.map((p: Permission) => p.id),
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    try {
      if (isEditing) {
        await api.put(`/admin/roles/${id}`, formData);
      } else {
        await api.post('/admin/roles', formData);
      }
      navigate('/admin/roles');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const toggleModulePermissions = (modulePermissions: Permission[]) => {
    const allSelected = modulePermissions.every((p) => formData.permissions.includes(p.id));
    const permissionIds = modulePermissions.map((p) => p.id);

    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((id) => !permissionIds.includes(id))
        : [...new Set([...prev.permissions, ...permissionIds])],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <button
        onClick={() => navigate('/admin/roles')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm sm:text-base">Назад к списку</span>
      </button>

      <div className="card p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Редактирование роли' : 'Создание роли'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Системное имя
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="manager"
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Отображаемое имя
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="input"
                placeholder="Менеджер"
                required
              />
              {errors.display_name && <p className="text-red-500 text-sm mt-1">{errors.display_name[0]}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Описание роли..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Разрешения
            </label>

            <div className="space-y-4">
              {Object.entries(permissions).map(([module, modulePermissions]) => {
                const allSelected = modulePermissions.every((p) =>
                  formData.permissions.includes(p.id)
                );
                const someSelected = modulePermissions.some((p) =>
                  formData.permissions.includes(p.id)
                );

                return (
                  <div key={module} className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleModulePermissions(modulePermissions)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">
                        {modules[module] || module}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                      {modulePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-gray-700">{permission.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" disabled={isSaving} className="btn btn-primary flex items-center justify-center gap-2 order-1">
              <Save className="w-5 h-5" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="btn btn-secondary order-2"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
