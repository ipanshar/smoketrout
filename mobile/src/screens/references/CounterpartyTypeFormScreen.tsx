import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {navigation: NativeStackNavigationProp<any>; route: RouteProp<any>};

export default function CounterpartyTypeFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (isEditing) loadData(); }, [id]);

  const loadData = async () => {
    try {
      const response = await api.get(`/references/counterparty-types/${id}`);
      const data = response.data;
      setName(data.name);
      setCode(data.code);
      setDescription(data.description || '');
      setIsActive(data.is_active);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {name, code, description, is_active: isActive};
      if (isEditing) await api.put(`/references/counterparty-types/${id}`, payload);
      else await api.post('/references/counterparty-types', payload);
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
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Поставщик" />

        <Text style={styles.label}>Код *</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="supplier" editable={!isEditing} />

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
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16},
  button: {backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
