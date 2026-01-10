import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {navigation: NativeStackNavigationProp<any>; route: RouteProp<any>};

interface CounterpartyType {id: number; name: string}

export default function CounterpartyFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [inn, setInn] = useState('');
  const [kpp, setKpp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [types, setTypes] = useState<CounterpartyType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { 
    loadTypes(); 
    if (isEditing) loadData(); 
  }, [id]);

  const loadTypes = async () => {
    try {
      const response = await api.get('/references/counterparty-types?active=true');
      setTypes(response.data.data);
    } catch (error) {}
  };

  const loadData = async () => {
    try {
      const response = await api.get(`/references/counterparties/${id}`);
      const data = response.data;
      setName(data.name);
      setCode(data.code);
      setSelectedTypeIds(data.types?.map((t: any) => t.id) || []);
      setInn(data.inn || '');
      setKpp(data.kpp || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setIsActive(data.is_active);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить');
      navigation.goBack();
    }
  };

  const toggleType = (typeId: number) => {
    if (selectedTypeIds.includes(typeId)) {
      setSelectedTypeIds(selectedTypeIds.filter(id => id !== typeId));
    } else {
      setSelectedTypeIds([...selectedTypeIds, typeId]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || selectedTypeIds.length === 0) {
      Alert.alert('Ошибка', 'Заполните обязательные поля и выберите хотя бы один тип');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {name, code, type_ids: selectedTypeIds, inn, kpp, phone, email, address, is_active: isActive};
      if (isEditing) await api.put(`/references/counterparties/${id}`, payload);
      else await api.post('/references/counterparties', payload);
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
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ООО Рыбпром" />

        <Text style={styles.label}>Код *</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="rybprom" editable={!isEditing} />

        <Text style={styles.label}>Типы контрагента *</Text>
        <View style={styles.typesContainer}>
          {types.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, selectedTypeIds.includes(t.id) && styles.typeChipSelected]}
              onPress={() => toggleType(t.id)}>
              <Text style={[styles.typeChipText, selectedTypeIds.includes(t.id) && styles.typeChipTextSelected]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ИНН</Text>
        <TextInput style={styles.input} value={inn} onChangeText={setInn} keyboardType="numeric" maxLength={12} />

        <Text style={styles.label}>КПП</Text>
        <TextInput style={styles.input} value={kpp} onChangeText={setKpp} keyboardType="numeric" maxLength={9} />

        <Text style={styles.label}>Телефон</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Адрес</Text>
        <TextInput style={[styles.input, {height: 80}]} value={address} onChangeText={setAddress} multiline />

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
  typesContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  typeChip: {backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB'},
  typeChipSelected: {backgroundColor: '#DBEAFE', borderColor: '#2563EB'},
  typeChipText: {fontSize: 14, color: '#374151'},
  typeChipTextSelected: {color: '#1D4ED8', fontWeight: '500'},
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16},
  button: {backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
