import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface ProductType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

type Props = {navigation: NativeStackNavigationProp<any>};

export default function ProductTypesScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [items, setItems] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/references/product-types');
      setItems(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: ProductType) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/references/product-types/${item.id}`);
          setItems(items.filter(i => i.id !== item.id));
        } catch (error: any) {
          Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
        }
      }},
    ]);
  };

  const renderItem = ({item}: {item: ProductType}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductTypeForm', {id: item.id})}
      onLongPress={() => hasPermission('references.product_types.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.code}>{item.code}</Text>
        {item.description && <Text style={styles.description}>{item.description}</Text>}
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
      {hasPermission('references.product_types.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ProductTypeForm', {})}>
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
  description: {fontSize: 13, color: '#9CA3AF', marginTop: 2},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 5},
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
