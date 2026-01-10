import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface Counterparty {
  id: number;
  name: string;
  code: string;
  inn: string | null;
  phone: string | null;
  types: {name: string}[];
  is_active: boolean;
}

type Props = {navigation: NativeStackNavigationProp<any>};

export default function CounterpartiesScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [items, setItems] = useState<Counterparty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/references/counterparties');
      setItems(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: Counterparty) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/references/counterparties/${item.id}`);
          setItems(items.filter(i => i.id !== item.id));
        } catch (error: any) {
          Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
        }
      }},
    ]);
  };

  const renderItem = ({item}: {item: Counterparty}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CounterpartyForm', {id: item.id})}
      onLongPress={() => hasPermission('references.counterparties.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.code}>{item.code}</Text>
        {item.inn && <Text style={styles.inn}>ИНН: {item.inn}</Text>}
        {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
        <View style={styles.typesRow}>
          {item.types.map((t, i) => (
            <View key={i} style={styles.typeChip}>
              <Text style={styles.typeChipText}>{t.name}</Text>
            </View>
          ))}
        </View>
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
      {hasPermission('references.counterparties.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CounterpartyForm', {})}>
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
  code: {fontSize: 14, color: '#6B7280', marginTop: 2},
  inn: {fontSize: 13, color: '#9CA3AF', marginTop: 2},
  phone: {fontSize: 13, color: '#9CA3AF'},
  typesRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4},
  typeChip: {backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  typeChipText: {fontSize: 11, color: '#1D4ED8'},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 5},
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
