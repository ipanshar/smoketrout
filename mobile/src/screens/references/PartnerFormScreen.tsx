import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert} from 'react-native';
import api from '../../lib/api';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

type Props = {navigation: NativeStackNavigationProp<any>; route: RouteProp<any>};

export default function PartnerFormScreen({navigation, route}: Props) {
  const {id} = route.params || {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sharePercentage, setSharePercentage] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [availableShare, setAvailableShare] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { 
    loadAvailableShare();
    if (isEditing) loadData(); 
  }, [id]);

  const loadAvailableShare = async () => {
    try {
      const response = await api.get('/references/partners');
      const currentTotal = parseFloat(response.data.total_share) || 0;
      setAvailableShare(100 - currentTotal);
    } catch (error) {}
  };

  const loadData = async () => {
    try {
      const response = await api.get(`/references/partners/${id}`);
      const data = response.data;
      setName(data.name);
      setCode(data.code);
      setSharePercentage(data.share_percentage);
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setDescription(data.description || '');
      setIsActive(data.is_active);
      // При редактировании добавляем текущую долю к доступной
      setAvailableShare(prev => prev + parseFloat(data.share_percentage));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || !sharePercentage) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name, 
        code, 
        share_percentage: parseFloat(sharePercentage), 
        phone, 
        email, 
        description, 
        is_active: isActive
      };
      if (isEditing) await api.put(`/references/partners/${id}`, payload);
      else await api.post('/references/partners', payload);
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
        <Text style={styles.label}>Имя / Название *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Иван Иванов" />

        <Text style={styles.label}>Код *</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="ivan" editable={!isEditing} />

        <Text style={styles.label}>Доля в проекте (%) *</Text>
        <View style={styles.shareRow}>
          <TextInput 
            style={[styles.input, {width: 100}]} 
            value={sharePercentage} 
            onChangeText={setSharePercentage} 
            keyboardType="decimal-pad" 
            placeholder="0.00"
          />
          <Text style={styles.shareAvailable}>Доступно: {availableShare.toFixed(2)}%</Text>
        </View>
        <View style={styles.shareBar}>
          <View style={[styles.shareFill, {width: `${Math.min(parseFloat(sharePercentage) || 0, 100)}%`}]} />
        </View>

        <Text style={styles.label}>Телефон</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

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
  shareRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  shareAvailable: {fontSize: 13, color: '#6B7280'},
  shareBar: {height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 8, overflow: 'hidden'},
  shareFill: {height: 8, backgroundColor: '#3B82F6', borderRadius: 4},
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16},
  button: {backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
