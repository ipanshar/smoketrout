import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface Unit {
  id: number;
  name: string;
  short_name: string;
  is_active: boolean;
}

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function UnitsScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await api.get('/references/units');
      setUnits(response.data.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: Unit) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/references/units/${item.id}`);
            setUnits(units.filter(u => u.id !== item.id));
          } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const renderItem = ({item}: {item: Unit}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UnitForm', {id: item.id})}
      onLongPress={() => hasPermission('references.units.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.shortName}>{item.short_name}</Text>
      </View>
      <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{item.is_active ? 'Активна' : 'Неактивна'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={units}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUnits(); }} />}
        ListEmptyComponent={!isLoading ? <View style={styles.empty}><Text style={styles.emptyText}>Нет данных</Text></View> : null}
      />
      {hasPermission('references.units.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('UnitForm', {})}>
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
  name: {fontSize: 16, fontWeight: '600', color: '#111827'},
  shortName: {fontSize: 14, color: '#6B7280', marginTop: 2},
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
