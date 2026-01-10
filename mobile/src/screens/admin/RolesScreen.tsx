import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Permission {
  id: number;
  name: string;
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RolesScreen({navigation}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.roles);
      setModules(response.data.modules);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить роли');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getModuleNames = (permissions: Permission[]) => {
    const moduleKeys = [...new Set(permissions.map(p => p.module))];
    return moduleKeys.map(key => modules[key] || key).join(', ');
  };

  const handleDelete = (role: Role) => {
    if (role.is_system) {
      Alert.alert('Ошибка', 'Системную роль нельзя удалить');
      return;
    }

    Alert.alert('Удалить роль?', 'Это действие нельзя отменить', [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/roles/${role.id}`);
            setRoles(roles.filter(r => r.id !== role.id));
          } catch (error: any) {
            Alert.alert(
              'Ошибка',
              error.response?.data?.message || 'Не удалось удалить',
            );
          }
        },
      },
    ]);
  };

  const renderRole = ({item}: {item: Role}) => (
    <TouchableOpacity
      style={styles.roleCard}
      onPress={() => navigation.navigate('RoleForm', {id: item.id})}
      onLongPress={() => handleDelete(item)}>
      <View style={styles.roleHeader}>
        <View style={styles.roleIcon}>
          <Text style={styles.roleEmoji}>🛡️</Text>
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.display_name}</Text>
          <Text style={styles.roleSlug}>{item.name}</Text>
        </View>
        <View style={styles.userCount}>
          <Text style={styles.userCountText}>👥 {item.users_count}</Text>
        </View>
      </View>
      <Text style={styles.roleModules} numberOfLines={1}>
        {getModuleNames(item.permissions) || 'Нет доступа'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={roles}
        renderItem={renderRole}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadRoles();
          }} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Нет ролей</Text>
            </View>
          ) : null
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RoleForm', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleEmoji: {
    fontSize: 18,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  roleSlug: {
    fontSize: 13,
    color: '#6B7280',
  },
  userCount: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  userCountText: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleModules: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
