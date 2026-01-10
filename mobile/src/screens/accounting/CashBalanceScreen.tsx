import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';

interface CashBalance {
  currency: { id: number; code: string; symbol: string };
  balance: number;
}

interface CashSummary {
  cash_register: { id: number; name: string; currency?: { id: number; code: string; symbol: string } };
  balances: CashBalance[];
}

interface CashMovement {
  id: number;
  amount: number;
  cash_register: { name: string };
  currency: { code: string };
  transaction: {
    number: string;
    type: string;
    date: string;
  };
}

const typeLabels: Record<string, string> = {
  cash_in: 'Приход',
  cash_out: 'Расход',
  sale: 'Продажа',
  sale_payment: 'Оплата от покупателя',
  purchase: 'Покупка',
  purchase_payment: 'Оплата поставщику',
  dividend_payment: 'Выплата дивидендов',
  salary_accrual: 'Начисление зарплаты',
  salary_payment: 'Выплата зарплаты',
};

export default function CashBalanceScreen() {
  const [summary, setSummary] = useState<CashSummary[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [summaryRes, movementsRes] = await Promise.all([
        api.get('/accounting/cash/summary'),
        api.get('/accounting/cash/movements', { params: { per_page: 20 } }),
      ]);
      setSummary(summaryRes.data);
      setMovements(movementsRes.data.data);
    } catch (error) {
      console.error('Error loading cash data:', error);
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

  // Группируем балансы по валютам
  const totalsByCurrency: Record<string, { balance: number; symbol: string; code: string }> = {};
  summary.forEach((s) => {
    s.balances.forEach((b) => {
      if (!totalsByCurrency[b.currency.code]) {
        totalsByCurrency[b.currency.code] = { balance: 0, symbol: b.currency.symbol, code: b.currency.code };
      }
      totalsByCurrency[b.currency.code].balance += Number(b.balance);
    });
  });

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
      {/* Total balances by currency */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Общий баланс</Text>
        {Object.values(totalsByCurrency).map((curr) => (
          <Text key={curr.code} style={styles.totalAmount}>
            {curr.balance.toLocaleString('ru')} {curr.symbol}
          </Text>
        ))}
        {Object.keys(totalsByCurrency).length === 0 && (
          <Text style={styles.totalAmount}>0</Text>
        )}
      </View>

      {/* Cash registers */}
      <Text style={styles.sectionTitle}>Кассы</Text>
      {summary.map((s) => (
        <View key={s.cash_register.id} style={styles.card}>
          <Text style={styles.cardTitle}>{s.cash_register.name}</Text>
          {s.balances.length === 0 ? (
            <Text style={styles.emptyText}>Нет операций</Text>
          ) : (
            s.balances.map((b) => (
              <View key={b.currency.id} style={styles.balanceRow}>
                <Text style={styles.currencyCode}>{b.currency.code}</Text>
                <Text style={[styles.balanceAmount, { color: Number(b.balance) >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {Number(b.balance).toLocaleString('ru')}
                </Text>
              </View>
            ))
          )}
        </View>
      ))}

      {/* Recent movements */}
      <Text style={styles.sectionTitle}>Последние движения</Text>
      {movements.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Нет движений</Text>
        </View>
      ) : (
        movements.map((m) => (
          <View key={m.id} style={styles.movementItem}>
            <View style={styles.movementLeft}>
              <Text style={styles.movementNumber}>{m.transaction.number}</Text>
              <Text style={styles.movementType}>{typeLabels[m.transaction.type] || m.transaction.type}</Text>
              <Text style={styles.movementDate}>{new Date(m.transaction.date).toLocaleDateString('ru')}</Text>
            </View>
            <Text style={[styles.movementAmount, { color: Number(m.amount) >= 0 ? '#22c55e' : '#ef4444' }]}>
              {Number(m.amount) >= 0 ? '+' : ''}{Number(m.amount).toLocaleString('ru')} {m.currency.code}
            </Text>
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
  totalCard: {
    backgroundColor: '#3b82f6',
    margin: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  currencyCode: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  movementItem: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  movementLeft: {
    flex: 1,
  },
  movementNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  movementType: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  movementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  movementAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
});
