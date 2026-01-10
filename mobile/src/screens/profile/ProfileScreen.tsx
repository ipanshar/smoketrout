import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import api from '../../lib/api';

export default function ProfileScreen() {
  const {user, setUser} = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.put('/user/profile', formData);
      setUser(response.data);
      Alert.alert('Успешно', 'Профиль обновлён');
    } catch (error: any) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось обновить профиль',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.current_password || !passwordData.password) {
      Alert.alert('Ошибка', 'Заполните все поля пароля');
      return;
    }

    if (passwordData.password !== passwordData.password_confirmation) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setIsPasswordLoading(true);
    try {
      await api.put('/user/password', passwordData);
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      Alert.alert('Успешно', 'Пароль изменён');
    } catch (error: any) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось изменить пароль',
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.roleBadge}>
          {user?.role?.display_name || 'Пользователь'}
        </Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основная информация</Text>
        
        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={text => setFormData(prev => ({...prev, name: text}))}
          placeholder="Ваше имя"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={text => setFormData(prev => ({...prev, email: text}))}
          placeholder="email@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Password Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Смена пароля</Text>

        <Text style={styles.label}>Текущий пароль</Text>
        <TextInput
          style={styles.input}
          value={passwordData.current_password}
          onChangeText={text =>
            setPasswordData(prev => ({...prev, current_password: text}))
          }
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={styles.label}>Новый пароль</Text>
        <TextInput
          style={styles.input}
          value={passwordData.password}
          onChangeText={text =>
            setPasswordData(prev => ({...prev, password: text}))
          }
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={styles.label}>Подтверждение нового пароля</Text>
        <TextInput
          style={styles.input}
          value={passwordData.password_confirmation}
          onChangeText={text =>
            setPasswordData(prev => ({...prev, password_confirmation: text}))
          }
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isPasswordLoading && styles.buttonDisabled]}
          onPress={handleUpdatePassword}
          disabled={isPasswordLoading}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {isPasswordLoading ? 'Сохранение...' : 'Изменить пароль'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#2563EB',
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#374151',
  },
});
