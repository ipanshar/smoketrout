import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  type: {name: string} | null;
  unit: {short_name: string} | null;
  price: string;
  is_active: boolean;
}

type Props = {navigation: NativeStackNavigationProp<any>};

export default function ProductsScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('₽');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [productsRes, currenciesRes] = await Promise.all([
        api.get('/references/products'),
        api.get('/currencies'),
      ]);
      setItems(productsRes.data.data);
      const defaultCurrency = currenciesRes.data.find((c: { is_default: boolean }) => c.is_default);
      if (defaultCurrency) {
        setCurrencySymbol(defaultCurrency.symbol || defaultCurrency.code);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: Product) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/references/products/${item.id}`);
          setItems(items.filter(i => i.id !== item.id));
        } catch (error: any) {
          Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
        }
      }},
    ]);
  };

  const renderItem = ({item}: {item: Product}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductForm', {id: item.id})}
      onLongPress={() => hasPermission('references.products.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sku}>Артикул: {item.sku}</Text>
        <View style={styles.infoRow}>
          {item.type && <Text style={styles.badge2}>{item.type.name}</Text>}
          {item.unit && <Text style={styles.badge2}>{item.unit.short_name}</Text>}
        </View>
        <Text style={styles.price}>{parseFloat(item.price).toLocaleString('ru-RU')} {currencySymbol}</Text>
      </View>
      <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{item.is_active ? 'Активен' : 'Неактивен'}</Text>
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
      {hasPermission('references.products.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ProductForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  list: {padding: 16},
  card: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', elevation: 2},
  cardContent: {flex: 1},
  name: {fontSize: 16, fontWeight: '600', color: '#111827'},
  sku: {fontSize: 13, color: '#9CA3AF', marginTop: 2},
  infoRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6},
  badge2: {backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 12, color: '#374151'},
  price: {fontSize: 15, fontWeight: '600', color: '#059669', marginTop: 6},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 5},
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
