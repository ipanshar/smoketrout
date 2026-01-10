import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  exchange_rate: string;
  is_default: boolean;
  is_active: boolean;
}

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CurrenciesScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/references/currencies');
      setCurrencies(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: Currency) => {
    if (item.is_default) {
      Alert.alert('Ошибка', 'Нельзя удалить валюту по умолчанию');
      return;
    }
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/references/currencies/${item.id}`);
            setCurrencies(currencies.filter(c => c.id !== item.id));
          } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const renderItem = ({item}: {item: Currency}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CurrencyForm', {id: item.id})}
      onLongPress={() => hasPermission('references.currencies.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          {item.is_default && <Text style={styles.star}>⭐</Text>}
        </View>
        <Text style={styles.code}>{item.code} • {item.symbol}</Text>
        <Text style={styles.rate}>Курс: {parseFloat(item.exchange_rate).toLocaleString()}</Text>
      </View>
      <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{item.is_active ? 'Активна' : 'Неактивна'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={currencies}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={!isLoading ? <View style={styles.empty}><Text style={styles.emptyText}>Нет данных</Text></View> : null}
      />
      {hasPermission('references.currencies.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CurrencyForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  list: {padding: 16},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center'},
  name: {fontSize: 16, fontWeight: '600', color: '#111827'},
  star: {marginLeft: 6},
  code: {fontSize: 14, color: '#6B7280', marginTop: 2},
  rate: {fontSize: 13, color: '#9CA3AF', marginTop: 2},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
