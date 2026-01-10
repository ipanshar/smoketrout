import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {navigation: NativeStackNavigationProp<any>; route: RouteProp<any>};

interface ProductType {id: number; name: string}
interface Unit {id: number; name: string}

export default function ProductFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [typeId, setTypeId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [price, setPrice] = useState('0');
  const [costPrice, setCostPrice] = useState('0');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { 
    loadReferences(); 
    if (isEditing) loadData(); 
  }, [id]);

  const loadReferences = async () => {
    try {
      const [typesRes, unitsRes] = await Promise.all([
        api.get('/references/product-types?active=true'),
        api.get('/references/units?active=true')
      ]);
      setTypes(typesRes.data.data);
      setUnits(unitsRes.data.data);
      if (!isEditing) {
        if (typesRes.data.data.length > 0) setTypeId(typesRes.data.data[0].id);
        if (unitsRes.data.data.length > 0) setUnitId(unitsRes.data.data[0].id);
      }
    } catch (error) {}
  };

  const loadData = async () => {
    try {
      const response = await api.get(`/references/products/${id}`);
      const data = response.data;
      setName(data.name);
      setSku(data.sku);
      setTypeId(data.type_id);
      setUnitId(data.unit_id);
      setPrice(data.price);
      setCostPrice(data.cost_price || '0');
      setDescription(data.description || '');
      setIsActive(data.is_active);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !sku.trim() || !typeId || !unitId) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {name, sku, type_id: typeId, unit_id: unitId, price: parseFloat(price), cost_price: parseFloat(costPrice), description, is_active: isActive};
      if (isEditing) await api.put(`/references/products/${id}`, payload);
      else await api.post('/references/products', payload);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось сохранить');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Название *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Форель радужная" />

        <Text style={styles.label}>Артикул (SKU) *</Text>
        <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="TROUT-001" editable={!isEditing} />

        <Text style={styles.label}>Тип товара *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={typeId} onValueChange={setTypeId}>
            {types.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Единица измерения *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={unitId} onValueChange={setUnitId}>
            {units.map(u => <Picker.Item key={u.id} label={u.name} value={u.id} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Цена продажи</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

        <Text style={styles.label}>Себестоимость</Text>
        <TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" />

        <Text style={styles.label}>Описание</Text>
        <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} multiline />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Активен</Text>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{true: '#2563EB'}} />
        </View>

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Сохранение...' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  form: {padding: 16},
  label: {fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12},
  input: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16},
  pickerContainer: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8},
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16},
  button: {backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
