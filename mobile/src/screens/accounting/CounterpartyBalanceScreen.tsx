import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';

interface Currency {
  id: number;
  code: string;
  symbol: string;
}

interface BalanceItem {
  currency: Currency;
  balance: number;
}

interface CounterpartyBalance {
  counterparty: { id: number; name: string };
  balances: BalanceItem[];
}

interface SummaryCurrency {
  currency: Currency;
  total_receivable: number;
  total_payable: number;
}

interface Summary {
  by_currency: SummaryCurrency[];
  debtors_count: number;
  creditors_count: number;
}

export default function CounterpartyBalanceScreen() {
  const [balances, setBalances] = useState<CounterpartyBalance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [balancesRes, summaryRes] = await Promise.all([
        api.get('/accounting/counterparties/balances'),
        api.get('/accounting/counterparties/summary'),
      ]);
      setBalances(balancesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading counterparty data:', error);
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
      {/* Summary cards by currency */}
      {summary?.by_currency?.map((curr) => (
        <View key={curr.currency.id} style={styles.currencyCard}>
          <Text style={styles.currencyTitle}>{curr.currency.code}</Text>
          <View style={styles.currencyRow}>
            <View style={styles.currencyItem}>
              <Text style={[styles.currencyValue, { color: '#22c55e' }]}>
                {curr.total_receivable.toLocaleString('ru')} {curr.currency.symbol}
              </Text>
              <Text style={styles.currencyLabel}>Нам должны</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={[styles.currencyValue, { color: '#ef4444' }]}>
                {curr.total_payable.toLocaleString('ru')} {curr.currency.symbol}
              </Text>
              <Text style={styles.currencyLabel}>Мы должны</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.countRow}>
        <View style={styles.countCard}>
          <Text style={styles.countValue}>{summary?.debtors_count || 0}</Text>
          <Text style={styles.countLabel}>Должников</Text>
        </View>
        <View style={styles.countCard}>
          <Text style={styles.countValue}>{summary?.creditors_count || 0}</Text>
          <Text style={styles.countLabel}>Кредиторов</Text>
        </View>
      </View>

      {/* Balances list */}
      <Text style={styles.sectionTitle}>Контрагенты</Text>
      
      {balances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет взаиморасчётов</Text>
        </View>
      ) : (
        balances.map((b) => (
          <View key={b.counterparty.id} style={styles.balanceItem}>
            <Text style={styles.counterpartyName}>{b.counterparty.name}</Text>
            <View style={styles.balanceDetails}>
              {b.balances.filter(bl => Number(bl.balance) > 0).map((bl, i) => (
                <View key={`rec-${i}`} style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Нам должны:</Text>
                  <Text style={[styles.balanceValue, { color: '#22c55e' }]}>
                    +{Number(bl.balance).toLocaleString('ru')} {bl.currency.symbol}
                  </Text>
                </View>
              ))}
              {b.balances.filter(bl => Number(bl.balance) < 0).map((bl, i) => (
                <View key={`pay-${i}`} style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Мы должны:</Text>
                  <Text style={[styles.balanceValue, { color: '#ef4444' }]}>
                    {Number(bl.balance).toLocaleString('ru')} {bl.currency.symbol}
                  </Text>
                </View>
              ))}
            </View>
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
  currencyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  currencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 16,
  },
  currencyItem: {
    flex: 1,
    alignItems: 'center',
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  countRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  countCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  countLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  balanceItem: {
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
  counterpartyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  balanceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
