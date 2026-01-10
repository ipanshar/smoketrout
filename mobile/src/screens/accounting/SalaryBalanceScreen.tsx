import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';

interface User {
  id: number;
  name: string;
}

interface Currency {
  id: number;
  code: string;
  symbol: string;
}

interface SummaryCurrency {
  currency: Currency;
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
}

interface UserBalance {
  currency: Currency;
  total_accrued: number;
  total_paid: number;
  balance: number;
}

interface Summary {
  by_currency: SummaryCurrency[];
  total_accrued: number;
  total_paid: number;
  total_unpaid: number;
  users: {
    user: User;
    total_accrued: number;
    total_paid: number;
    balance: number;
    balances_by_currency?: UserBalance[];
  }[];
}

export default function SalaryBalanceScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get('/accounting/salary/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading salary data:', error);
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
      {summary?.by_currency && summary.by_currency.length > 0 ? (
        summary.by_currency.map((currencyData) => (
          <View key={currencyData.currency.id} style={styles.currencySection}>
            <Text style={styles.currencyTitle}>{currencyData.currency.code}</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.summaryValue}>{currencyData.total_accrued.toLocaleString('ru')}</Text>
                <Text style={styles.summaryLabel}>Начислено {currencyData.currency.symbol}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.summaryValue}>{currencyData.total_paid.toLocaleString('ru')}</Text>
                <Text style={styles.summaryLabel}>Выплачено {currencyData.currency.symbol}</Text>
              </View>
            </View>
            <View style={styles.unpaidCard}>
              <Text style={styles.unpaidLabel}>К выплате</Text>
              <Text style={styles.unpaidValue}>{currencyData.total_unpaid.toLocaleString('ru')} {currencyData.currency.symbol}</Text>
            </View>
          </View>
        ))
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.summaryValue}>{summary?.total_accrued.toLocaleString('ru')}</Text>
              <Text style={styles.summaryLabel}>Начислено</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.summaryValue}>{summary?.total_paid.toLocaleString('ru')}</Text>
              <Text style={styles.summaryLabel}>Выплачено</Text>
            </View>
          </View>
          <View style={styles.unpaidCard}>
            <Text style={styles.unpaidLabel}>К выплате</Text>
            <Text style={styles.unpaidValue}>{summary?.total_unpaid.toLocaleString('ru')}</Text>
          </View>
        </>
      )}

      {/* Users */}
      <Text style={styles.sectionTitle}>Сотрудники</Text>

      {!summary?.users || summary.users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет данных о зарплате</Text>
        </View>
      ) : (
        summary.users.map((u) => (
          <View key={u.user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{u.user.name}</Text>
            </View>

            {/* Progress bar */}
            {u.total_accrued > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(u.total_paid / u.total_accrued) * 100}%`,
                        backgroundColor: '#22c55e'
                      }
                    ]}
                  />
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(u.balance / u.total_accrued) * 100}%`,
                        backgroundColor: '#f59e0b'
                      }
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Balances by currency */}
            {u.balances_by_currency && u.balances_by_currency.length > 0 ? (
              <View style={styles.userDetails}>
                {u.balances_by_currency.map((bal) => (
                  <View key={bal.currency.id} style={styles.currencyBalance}>
                    <Text style={styles.currencyBalanceTitle}>{bal.currency.code}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Начислено:</Text>
                      <Text style={styles.detailValue}>{bal.total_accrued.toLocaleString('ru')} {bal.currency.symbol}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Выплачено:</Text>
                      <Text style={[styles.detailValue, { color: '#22c55e' }]}>{bal.total_paid.toLocaleString('ru')} {bal.currency.symbol}</Text>
                    </View>
                    <View style={[styles.detailRow, styles.balanceRow]}>
                      <Text style={styles.balanceLabel}>К выплате:</Text>
                      <Text style={[styles.balanceValue, { color: bal.balance > 0 ? '#f59e0b' : '#666' }]}>
                        {bal.balance.toLocaleString('ru')} {bal.currency.symbol}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.userDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Начислено:</Text>
                  <Text style={styles.detailValue}>{u.total_accrued.toLocaleString('ru')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Выплачено:</Text>
                  <Text style={[styles.detailValue, { color: '#22c55e' }]}>{u.total_paid.toLocaleString('ru')}</Text>
                </View>
                <View style={[styles.detailRow, styles.balanceRow]}>
                  <Text style={styles.balanceLabel}>К выплате:</Text>
                  <Text style={[styles.balanceValue, { color: u.balance > 0 ? '#f59e0b' : '#666' }]}>
                    {u.balance.toLocaleString('ru')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  currencySection: {
    marginBottom: 8,
  },
  currencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  currencyBalance: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  currencyBalanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  unpaidCard: {
    backgroundColor: '#f59e0b',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unpaidLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  unpaidValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  balanceRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
