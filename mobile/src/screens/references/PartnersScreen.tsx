import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

interface Partner {
  id: number;
  name: string;
  code: string;
  share_percentage: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

type Props = {navigation: NativeStackNavigationProp<any>};

export default function PartnersScreen({navigation}: Props) {
  const {hasPermission} = useAuth();
  const [items, setItems] = useState<Partner[]>([]);
  const [totalShare, setTotalShare] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/references/partners');
      setItems(response.data.data);
      setTotalShare(response.data.total_share);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item: Partner) => {
    Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/references/partners/${item.id}`);
          loadData();
        } catch (error: any) {
          Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить');
        }
      }},
    ]);
  };

  const renderItem = ({item}: {item: Partner}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PartnerForm', {id: item.id})}
      onLongPress={() => hasPermission('references.partners.delete') && handleDelete(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.code}>{item.code}</Text>
        <View style={styles.shareContainer}>
          <View style={styles.shareBar}>
            <View style={[styles.shareFill, {width: `${parseFloat(item.share_percentage)}%`}]} />
          </View>
          <Text style={styles.shareText}>{parseFloat(item.share_percentage).toFixed(2)}%</Text>
        </View>
        {item.phone && <Text style={styles.contact}>{item.phone}</Text>}
      </View>
      <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{item.is_active ? 'Активен' : 'Неактивен'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Общая доля: {totalShare}%</Text>
      <View style={styles.totalBar}>
        <View style={[styles.totalFill, {width: `${Math.min(totalShare, 100)}%`, backgroundColor: totalShare > 100 ? '#EF4444' : totalShare === 100 ? '#10B981' : '#3B82F6'}]} />
      </View>
      <Text style={styles.headerSubtitle}>Доступно: {(100 - totalShare).toFixed(2)}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={!isLoading ? <View style={styles.empty}><Text style={styles.emptyText}>Нет компаньонов</Text></View> : null}
      />
      {hasPermission('references.partners.create') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PartnerForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  list: {padding: 16},
  header: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2},
  headerTitle: {fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8},
  headerSubtitle: {fontSize: 13, color: '#6B7280', marginTop: 4},
  totalBar: {height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden'},
  totalFill: {height: 12, borderRadius: 6},
  card: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', elevation: 2},
  cardContent: {flex: 1},
  name: {fontSize: 16, fontWeight: '600', color: '#111827'},
  code: {fontSize: 14, color: '#6B7280', marginTop: 2},
  shareContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8},
  shareBar: {flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, maxWidth: 100},
  shareFill: {height: 6, backgroundColor: '#3B82F6', borderRadius: 3},
  shareText: {fontSize: 16, fontWeight: '700', color: '#3B82F6'},
  contact: {fontSize: 13, color: '#9CA3AF', marginTop: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  badgeActive: {backgroundColor: '#D1FAE5'},
  badgeInactive: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 12, fontWeight: '500'},
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 16},
  fab: {position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 5},
  fabText: {fontSize: 28, color: '#FFFFFF', lineHeight: 32},
});
