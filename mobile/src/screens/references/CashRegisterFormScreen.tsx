import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {navigation: NativeStackNavigationProp<any>; route: RouteProp<any>};

interface Currency {id: number; name: string; code: string}

export default function CashRegisterFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('cash');
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadCurrencies(); if (isEditing) loadData(); }, [id]);

  const loadCurrencies = async () => {
    try {
      const response = await api.get('/references/currencies?active=true');
      setCurrencies(response.data.data);
      if (!isEditing && response.data.data.length > 0) {
        const def = response.data.data.find((c: Currency) => c.code === 'RUB') || response.data.data[0];
        setCurrencyId(def.id);
      }
    } catch (error) {}
  };

  const loadData = async () => {
    try {
      const response = await api.get(`/references/cash-registers/${id}`);
      const data = response.data;
      setName(data.name);
      setCode(data.code);
      setType(data.type);
      setCurrencyId(data.currency_id);
      setBalance(data.balance);
      setDescription(data.description || '');
      setIsActive(data.is_active);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || !currencyId) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {name, code, type, currency_id: currencyId, balance: parseFloat(balance), description, is_active: isActive};
      if (isEditing) await api.put(`/references/cash-registers/${id}`, payload);
      else await api.post('/references/cash-registers', payload);
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
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Основная касса" />

        <Text style={styles.label}>Код *</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="main" editable={!isEditing} />

        <Text style={styles.label}>Тип</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={type} onValueChange={setType}>
            <Picker.Item label="Наличные" value="cash" />
            <Picker.Item label="Банк" value="bank" />
            <Picker.Item label="Онлайн" value="online" />
          </Picker>
        </View>

        <Text style={styles.label}>Валюта *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={currencyId} onValueChange={setCurrencyId}>
            {currencies.map(c => <Picker.Item key={c.id} label={`${c.name} (${c.code})`} value={c.id} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Начальный баланс</Text>
        <TextInput style={styles.input} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />

        <Text style={styles.label}>Описание</Text>
        <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} multiline />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Активна</Text>
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
