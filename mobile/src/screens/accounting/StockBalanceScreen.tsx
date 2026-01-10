import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';

interface StockItem {
  product: { id: number; name: string; unit?: { short_name: string } };
  quantity: number;
  avg_cost: number;
  total_value: number;
}

interface WarehouseStock {
  warehouse: { id: number; name: string };
  items: StockItem[];
  total_value: number;
}

export default function StockBalanceScreen() {
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('₽');

  const loadData = async () => {
    try {
      const [stockRes, currenciesRes] = await Promise.all([
        api.get('/accounting/stock/balances'),
        api.get('/currencies'),
      ]);
      setStock(stockRes.data);
      const defaultCurrency = currenciesRes.data.find((c: { is_default: boolean }) => c.is_default);
      if (defaultCurrency) {
        setCurrencySymbol(defaultCurrency.symbol || defaultCurrency.code);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalValue = stock.reduce((acc, s) => acc + s.total_value, 0);
  const totalItems = stock.reduce((acc, s) => acc + s.items.length, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Позиций</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#22c55e' }]}>
          <Text style={styles.summaryValue}>{stock.length}</Text>
          <Text style={styles.summaryLabel}>Складов</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Общая стоимость</Text>
        <Text style={styles.totalAmount}>{totalValue.toLocaleString('ru')} {currencySymbol}</Text>
      </View>

      {/* Warehouses */}
      {stock.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет остатков на складах</Text>
        </View>
      ) : (
        stock.map((s) => (
          <View key={s.warehouse.id} style={styles.warehouseCard}>
            <View style={styles.warehouseHeader}>
              <Text style={styles.warehouseName}>{s.warehouse.name}</Text>
              <Text style={styles.warehouseTotal}>{s.total_value.toLocaleString('ru')} {currencySymbol}</Text>
            </View>

            {s.items.map((item, index) => (
              <View key={index} style={styles.stockItem}>
                <View style={styles.stockItemLeft}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productQty}>
                    {Number(item.quantity).toLocaleString('ru')} {item.product.unit?.short_name || 'шт'}
                  </Text>
                </View>
                <View style={styles.stockItemRight}>
                  <Text style={styles.productCost}>{Number(item.avg_cost).toLocaleString('ru')} {currencySymbol}</Text>
                  <Text style={styles.productValue}>{item.total_value.toLocaleString('ru')} {currencySymbol}</Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
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
  summaryRow: {
    flexDirection: 'row',
    margin: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
  warehouseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  warehouseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  warehouseTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stockItemLeft: {
    flex: 1,
  },
  stockItemRight: {
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productQty: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  productCost: {
    fontSize: 12,
    color: '#999',
  },
  productValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
});
