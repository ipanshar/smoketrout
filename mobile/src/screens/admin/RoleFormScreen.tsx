import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import api from '../../lib/api';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
}

type AdminStackParamList = {
  RoleForm: {id?: number};
};

type Props = NativeStackScreenProps<AdminStackParamList, 'RoleForm'>;

const MODULE_NAMES: Record<string, string> = {
  admin: 'Администрирование',
  accounting: 'Бухгалтерия',
  production: 'Производство',
  profile: 'Личный кабинет',
};

export default function RoleFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
    if (isEditing) {
      loadRole();
    }
  }, [id]);

  const loadPermissions = async () => {
    try {
      const response = await api.get('/admin/permissions');
      setPermissions(response.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить разрешения');
    }
  };

  const loadRole = async () => {
    try {
      const response = await api.get(`/admin/roles/${id}`);
      const role = response.data;
      setFormData({
        name: role.name,
        display_name: role.display_name,
      });
      setSelectedPermissions(role.permissions.map((p: Permission) => p.id));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить роль');
      navigation.goBack();
    }
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId],
    );
  };

  const toggleModule = (module: string) => {
    const modulePerms = permissions
      .filter(p => p.module === module)
      .map(p => p.id);
    const allSelected = modulePerms.every(id =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      setSelectedPermissions(prev =>
        prev.filter(id => !modulePerms.includes(id)),
      );
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms])]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.display_name.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        permissions: selectedPermissions,
      };

      if (isEditing) {
        await api.put(`/admin/roles/${id}`, payload);
      } else {
        await api.post('/admin/roles', payload);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось сохранить',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Системное имя</Text>
        <TextInput
          style={[styles.input, isEditing && styles.inputDisabled]}
          value={formData.name}
          onChangeText={text => setFormData(prev => ({...prev, name: text}))}
          placeholder="admin, manager, worker..."
          placeholderTextColor="#9CA3AF"
          editable={!isEditing}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Отображаемое имя</Text>
        <TextInput
          style={styles.input}
          value={formData.display_name}
          onChangeText={text =>
            setFormData(prev => ({...prev, display_name: text}))
          }
          placeholder="Администратор"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.sectionTitle}>Разрешения</Text>

        {Object.entries(groupedPermissions).map(([module, perms]) => {
          const moduleSelected = perms.every(p =>
            selectedPermissions.includes(p.id),
          );
          return (
            <View key={module} style={styles.moduleBlock}>
              <TouchableOpacity
                style={styles.moduleHeader}
                onPress={() => toggleModule(module)}>
                <Text style={styles.moduleName}>
                  {MODULE_NAMES[module] || module}
                </Text>
                <Switch
                  value={moduleSelected}
                  onValueChange={() => toggleModule(module)}
                  trackColor={{false: '#E5E7EB', true: '#93C5FD'}}
                  thumbColor={moduleSelected ? '#2563EB' : '#F3F4F6'}
                />
              </TouchableOpacity>

              {perms.map(perm => (
                <TouchableOpacity
                  key={perm.id}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(perm.id)}>
                  <Switch
                    value={selectedPermissions.includes(perm.id)}
                    onValueChange={() => togglePermission(perm.id)}
                    trackColor={{false: '#E5E7EB', true: '#93C5FD'}}
                    thumbColor={
                      selectedPermissions.includes(perm.id)
                        ? '#2563EB'
                        : '#F3F4F6'
                    }
                  />
                  <Text style={styles.permissionText}>{perm.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
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
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16,
  },
  moduleBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
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
