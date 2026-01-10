import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';

interface Partner {
  id: number;
  name: string;
  share_percentage: number;
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

interface PartnerBalance {
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
  partners: {
    partner: Partner;
    share_percentage: number;
    total_accrued: number;
    total_paid: number;
    balance: number;
    balances_by_currency?: PartnerBalance[];
  }[];
}

export default function DividendBalanceScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get('/accounting/dividends/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading dividend data:', error);
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

      {/* Partners */}
      <Text style={styles.sectionTitle}>Компаньоны</Text>

      {!summary?.partners || summary.partners.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет данных о дивидендах</Text>
        </View>
      ) : (
        summary.partners.map((p) => (
          <View key={p.partner.id} style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
              <Text style={styles.partnerName}>{p.partner.name}</Text>
              <View style={styles.shareBadge}>
                <Text style={styles.shareText}>{p.share_percentage}%</Text>
              </View>
            </View>

            {/* Progress bar */}
            {p.total_accrued > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(p.total_paid / p.total_accrued) * 100}%`,
                        backgroundColor: '#22c55e'
                      }
                    ]}
                  />
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(p.balance / p.total_accrued) * 100}%`,
                        backgroundColor: '#f59e0b'
                      }
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Balances by currency */}
            {p.balances_by_currency && p.balances_by_currency.length > 0 ? (
              <View style={styles.partnerDetails}>
                {p.balances_by_currency.map((bal) => (
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
              <View style={styles.partnerDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Начислено:</Text>
                  <Text style={styles.detailValue}>{p.total_accrued.toLocaleString('ru')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Выплачено:</Text>
                  <Text style={[styles.detailValue, { color: '#22c55e' }]}>{p.total_paid.toLocaleString('ru')}</Text>
                </View>
                <View style={[styles.detailRow, styles.balanceRow]}>
                  <Text style={styles.balanceLabel}>К выплате:</Text>
                  <Text style={[styles.balanceValue, { color: p.balance > 0 ? '#f59e0b' : '#666' }]}>
                    {p.balance.toLocaleString('ru')}
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
  partnerCard: {
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
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  shareBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  partnerDetails: {
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
