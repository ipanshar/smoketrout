import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

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
}

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function UsersScreen({navigation}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (searchQuery = '') => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    // Debounce search
    const timeoutId = setTimeout(() => loadUsers(text), 500);
    return () => clearTimeout(timeoutId);
  };

  const formatActivity = (date: string | null) => {
    if (!date) return 'Никогда';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} мин. назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн. назад`;
  };

  const handleDelete = (user: User) => {
    Alert.alert('Удалить пользователя?', 'Это действие нельзя отменить', [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${user.id}`);
            setUsers(users.filter(u => u.id !== user.id));
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

  const renderUser = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserForm', {id: item.id})}
      onLongPress={() => handleDelete(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {item.role?.display_name || 'Без роли'}
            </Text>
          </View>
          <Text style={styles.activity}>
            {formatActivity(item.last_activity_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="🔍 Поиск по имени или email..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers(search);
            }}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Пользователи не найдены</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UserForm', {})}>
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  activity: {
    fontSize: 12,
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
