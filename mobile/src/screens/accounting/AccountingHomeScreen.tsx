import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../lib/api';

interface MenuItem {
  title: string;
  screen: string;
  icon: string;
  description: string;
}

const menuItems: MenuItem[] = [
  { title: 'Движения', screen: 'TransactionsList', icon: '↔️', description: 'Создание и просмотр операций' },
  { title: 'Касса', screen: 'CashBalance', icon: '💰', description: 'Остатки и движения денег' },
  { title: 'Склад', screen: 'StockBalance', icon: '📦', description: 'Остатки товаров' },
  { title: 'Контрагенты', screen: 'CounterpartyBalance', icon: '👥', description: 'Взаиморасчёты' },
  { title: 'Дивиденды', screen: 'DividendBalance', icon: '💵', description: 'Начисления компаньонам' },
  { title: 'Зарплата', screen: 'SalaryBalance', icon: '💳', description: 'Начисления сотрудникам' },
];

export default function AccountingHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Бухгалтерия</Text>
      
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#ccc',
  },
});
