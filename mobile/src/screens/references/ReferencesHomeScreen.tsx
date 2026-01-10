import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface MenuItem {
  title: string;
  icon: string;
  screen: string;
  permission: string;
}

const menuItems: MenuItem[] = [
  {title: 'Контрагенты', icon: '🏢', screen: 'Counterparties', permission: 'references.counterparties.view'},
  {title: 'Типы контрагентов', icon: '🏷️', screen: 'CounterpartyTypes', permission: 'references.counterparty_types.view'},
  {title: 'Компаньоны', icon: '🤝', screen: 'Partners', permission: 'references.partners.view'},
  {title: 'Склады', icon: '🏭', screen: 'Warehouses', permission: 'references.warehouses.view'},
  {title: 'Кассы', icon: '💰', screen: 'CashRegisters', permission: 'references.cash_registers.view'},
  {title: 'Валюты', icon: '💱', screen: 'Currencies', permission: 'references.currencies.view'},
  {title: 'Товары', icon: '📦', screen: 'Products', permission: 'references.products.view'},
  {title: 'Типы товаров', icon: '📋', screen: 'ProductTypes', permission: 'references.product_types.view'},
  {title: 'Единицы измерения', icon: '📏', screen: 'Units', permission: 'references.units.view'},
];

export default function ReferencesHomeScreen({navigation}: Props) {
  const {hasPermission} = useAuth();

  const filteredItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {filteredItems.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: '1.5%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});
