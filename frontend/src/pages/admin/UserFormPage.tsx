import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  display_name: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role_id: number | null;
}

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role_id: null,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const rolesResponse = await api.get('/admin/users/roles');
      setRoles(rolesResponse.data.roles);

      if (isEditing) {
        const userResponse = await api.get(`/admin/users/${id}`);
        const user = userResponse.data.user;
        setFormData({
          name: user.name,
          email: user.email,
          password: '',
          role_id: user.role_id,
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
      const data: any = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
      };

      if (formData.password || !isEditing) {
        data.password = formData.password;
      }

      if (isEditing) {
        await api.put(`/admin/users/${id}`, data);
      } else {
        await api.post('/admin/users', data);
      }
      navigate('/admin/users');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm sm:text-base">Назад к списку</span>
      </button>

      <div className="card p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Редактирование пользователя' : 'Создание пользователя'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль {isEditing && <span className="text-gray-400">(оставьте пустым, чтобы не менять)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              minLength={8}
              required={!isEditing}
              placeholder={isEditing ? '••••••••' : ''}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              value={formData.role_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, role_id: e.target.value ? Number(e.target.value) : null })
              }
              className="input"
            >
              <option value="">Без роли</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" disabled={isSaving} className="btn btn-primary flex items-center justify-center gap-2 order-1">
              <Save className="w-5 h-5" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
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
