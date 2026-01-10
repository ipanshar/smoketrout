import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

export default function PartnerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    share_percentage: '',
    phone: '',
    email: '',
    description: '',
    is_active: true,
  });
  const [availableShare, setAvailableShare] = useState(100);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailableShare();
    if (isEditing) {
      loadPartner();
    }
  }, [id]);

  const loadAvailableShare = async () => {
    try {
      const response = await api.get('/references/partners');
      const currentTotal = parseFloat(response.data.total_share) || 0;
      setAvailableShare(100 - currentTotal);
    } catch (error) {}
  };

  const loadPartner = async () => {
    try {
      const response = await api.get(`/references/partners/${id}`);
      const partner = response.data;
      setFormData({
        name: partner.name,
        code: partner.code,
        share_percentage: partner.share_percentage,
        phone: partner.phone || '',
        email: partner.email || '',
        description: partner.description || '',
        is_active: partner.is_active,
      });
      // При редактировании добавляем текущую долю к доступной
      setAvailableShare(prev => prev + parseFloat(partner.share_percentage));
    } catch (error) {
      console.error('Failed to load partner:', error);
      navigate('/references/partners');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        share_percentage: parseFloat(formData.share_percentage) || 0,
      };

      if (isEditing) {
        await api.put(`/references/partners/${id}`, payload);
      } else {
        await api.post('/references/partners', payload);
      }
      navigate('/references/partners');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Редактирование компаньона' : 'Новый компаньон'}
      </h1>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя / Название *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Код *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isEditing}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Доля в проекте (%) *
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              name="share_percentage"
              value={formData.share_percentage}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="text-gray-500">%</span>
            <span className="text-sm text-gray-400">
              (доступно: {availableShare.toFixed(2)}%)
            </span>
          </div>
          {errors.share_percentage && <p className="text-red-500 text-sm mt-1">{errors.share_percentage}</p>}
          
          {/* Visual share preview */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  parseFloat(formData.share_percentage) > availableShare ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(parseFloat(formData.share_percentage) || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Активен
          </label>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/references/partners')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
