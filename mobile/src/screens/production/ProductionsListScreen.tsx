import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../lib/api';

interface Production {
  id: number;
  number: string;
  date: string;
  status: string;
  batch_count: number;
  recipe: { id: number; name: string; code: string };
  user: { id: number; name: string };
  output_warehouse: { id: number; name: string };
}

const statusColors: Record<string, string> = {
  draft: '#f59e0b',
  confirmed: '#22c55e',
  cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  confirmed: 'Проведён',
  cancelled: 'Отменён',
};

export default function ProductionsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProductions = async () => {
    try {
      const response = await api.get('/production/productions');
      setProductions(response.data.data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProductions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProductions();
  };

  const handleConfirm = async (id: number) => {
    Alert.alert(
      'Провести производство?',
      'Ингредиенты будут списаны, готовая продукция добавлена на склад.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Провести',
          onPress: async () => {
            try {
              await api.post(`/production/productions/${id}/confirm`);
              loadProductions();
            } catch (error: any) {
              Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось провести');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (id: number) => {
    Alert.alert(
      'Отменить производство?',
      'Все изменения будут отменены.',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Отменить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/production/productions/${id}/cancel`);
              loadProductions();
            } catch (error: any) {
              Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось отменить');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Production }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('ProductionDetail', { id: item.id })}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemNumber}>{item.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {statusLabels[item.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.itemRecipe}>
        {item.recipe.name} × {item.batch_count} партий
      </Text>
      <Text style={styles.itemMeta}>
        {new Date(item.date).toLocaleDateString('ru')} · {item.user.name}
      </Text>
      <Text style={styles.itemWarehouse}>{item.output_warehouse.name}</Text>

      {item.status === 'draft' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
            onPress={() => handleConfirm(item.id)}
          >
            <Text style={styles.actionBtnText}>Провести</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'confirmed' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.actionBtnText}>Отменить</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={productions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет производств</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductionForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemRecipe: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
  },
  itemWarehouse: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
