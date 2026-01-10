import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../lib/api';

interface Transaction {
  id: number;
  type: string;
  number: string;
  date: string;
  total_amount: number;
  status: string;
  currency?: { id: number; code: string; symbol: string } | null;
  counterparty?: { name: string } | null;
  partner?: { name: string } | null;
}

const typeLabels: Record<string, string> = {
  cash_in: 'Приход',
  cash_out: 'Расход',
  sale: 'Продажа',
  sale_payment: 'Оплата от покупателя',
  purchase: 'Покупка',
  purchase_payment: 'Оплата поставщику',
  transfer: 'Перемещение',
  dividend_accrual: 'Начисление дивидендов',
  dividend_payment: 'Выплата дивидендов',
  salary_accrual: 'Начисление зарплаты',
  salary_payment: 'Выплата зарплаты',
};

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

export default function TransactionsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/accounting/transactions');
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemNumber}>{item.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {statusLabels[item.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.itemType}>{typeLabels[item.type] || item.type}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString('ru')}</Text>
        <Text style={styles.itemAmount}>
          {Number(item.total_amount).toLocaleString('ru')} {item.currency?.symbol || ''}
        </Text>
      </View>
      {(item.counterparty || item.partner) && (
        <Text style={styles.itemCounterparty}>
          {item.counterparty?.name || item.partner?.name}
        </Text>
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
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет движений</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TransactionForm')}
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
  itemType: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 13,
    color: '#666',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemCounterparty: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
