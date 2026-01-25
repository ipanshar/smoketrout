import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import api from '../../lib/api';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

interface Role {
  id: number;
  name: string;
  display_name: string;
}

type AdminStackParamList = {
  UserForm: {id?: number};
};

type Props = NativeStackScreenProps<AdminStackParamList, 'UserForm'>;

export default function UserFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRoles();
    if (isEditing) {
      loadUser();
    }
  }, [id]);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadUser = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      const user = response.data;
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role_id: user.role_id?.toString() || '',
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить пользователя');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Ошибка', 'Заполните имя и email');
      return;
    }

    if (!isEditing && !formData.password) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, any> = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      if (formData.role_id) {
        payload.role_id = parseInt(formData.role_id);
      }

      if (isEditing) {
        await api.put(`/admin/users/${id}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }
      navigation.goBack();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        Alert.alert('Ошибка', Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось сохранить');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={text => setFormData(prev => ({...prev, name: text}))}
          placeholder="Иван Иванов"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={text => setFormData(prev => ({...prev, email: text}))}
          placeholder="user@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          {isEditing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.password}
          onChangeText={text => setFormData(prev => ({...prev, password: text}))}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={styles.label}>Подтверждение пароля</Text>
        <TextInput
          style={styles.input}
          value={formData.password_confirmation}
          onChangeText={text =>
            setFormData(prev => ({...prev, password_confirmation: text}))
          }
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={styles.label}>Роль</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.role_id}
            onValueChange={value =>
              setFormData(prev => ({...prev, role_id: value}))
            }
            style={styles.picker}>
            <Picker.Item label="Без роли" value="" />
            {roles.map(role => (
              <Picker.Item
                key={role.id}
                label={role.display_name}
                value={role.id.toString()}
              />
            ))}
          </Picker>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Сохранение...' : isEditing ? 'Обновить' : 'Создать'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
