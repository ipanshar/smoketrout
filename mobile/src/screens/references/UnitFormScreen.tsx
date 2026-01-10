import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function UnitFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadUnit();
    }
  }, [id]);

  const loadUnit = async () => {
    try {
      const response = await api.get(`/references/units/${id}`);
      const data = response.data;
      setName(data.name);
      setShortName(data.short_name);
      setIsActive(data.is_active);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !shortName.trim()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {name, short_name: shortName, is_active: isActive};
      if (isEditing) {
        await api.put(`/references/units/${id}`, payload);
      } else {
        await api.post('/references/units', payload);
      }
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
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Килограмм" />

        <Text style={styles.label}>Сокращение *</Text>
        <TextInput style={styles.input} value={shortName} onChangeText={setShortName} placeholder="кг" />

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
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16},
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
