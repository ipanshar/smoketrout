import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface CashRegister {
  id: number;
  name: string;
  code: string;
  type: string;
  balance: string;
  currency: {code: string; symbol: string} | null;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, string> = {cash: 'Наличные', bank: 'Банк', online: 'Онлайн'};

type Props = {navigation: NativeStackNavigationProp<any>};

export default function CashRegistersScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [items, setItems] = useState<CashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/references/cash-registers');
      setItems(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: CashRegister) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/references/cash-registers/${item.id}`);
          setItems(items.filter(i => i.id !== item.id));
        } catch (error: any) {
          Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
        }
      }},
    ]);
  };

  const renderItem = ({item}: {item: CashRegister}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CashRegisterForm', {id: item.id})}
      onLongPress={() => hasPermission('references.cash_registers.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.code}>{item.code} • {TYPE_LABELS[item.type]}</Text>
        <Text style={styles.balance}>
          {parseFloat(item.balance).toLocaleString('ru-RU')} {item.currency?.symbol || item.currency?.code || ''}
        </Text>
      </View>
      <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{item.is_active ? 'Активна' : 'Неактивна'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={!isLoading ? <View style={styles.empty}><Text style={styles.emptyText}>Нет данных</Text></View> : null}
      />
      {hasPermission('references.cash_registers.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CashRegisterForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  list: {padding: 16},
  card: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2},
  cardContent: {flex: 1},
  name: {fontSize: 16, fontWeight: '600', color: '#111827'},
  code: {fontSize: 14, color: '#6B7280', marginTop: 2},
  balance: {fontSize: 15, fontWeight: '600', color: '#059669', marginTop: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 5},
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
