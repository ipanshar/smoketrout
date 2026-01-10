import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {AuthProvider, useAuth} from './src/contexts/AuthContext';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from './src/screens/main/HomeScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';

// Admin Screens
import RolesScreen from './src/screens/admin/RolesScreen';
import RoleFormScreen from './src/screens/admin/RoleFormScreen';
import UsersScreen from './src/screens/admin/UsersScreen';
import UserFormScreen from './src/screens/admin/UserFormScreen';

// References Screens
import {
  ReferencesHomeScreen,
  UnitsScreen,
  UnitFormScreen,
  CurrenciesScreen,
  CurrencyFormScreen,
  WarehousesScreen,
  WarehouseFormScreen,
  CashRegistersScreen,
  CashRegisterFormScreen,
  ProductTypesScreen,
  ProductTypeFormScreen,
  ProductsScreen,
  ProductFormScreen,
  CounterpartyTypesScreen,
  CounterpartyTypeFormScreen,
  CounterpartiesScreen,
  CounterpartyFormScreen,
  PartnersScreen,
  PartnerFormScreen,
} from './src/screens/references';

// Accounting Screens
import {
  AccountingHomeScreen,
  TransactionsListScreen,
  CashBalanceScreen,
  StockBalanceScreen,
  CounterpartyBalanceScreen,
  DividendBalanceScreen,
  SalaryBalanceScreen,
} from './src/screens/accounting';

// Production Screens
import {
  ProductionHomeScreen,
  RecipesListScreen,
  ProductionsListScreen,
} from './src/screens/production';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();
const ReferencesStack = createNativeStackNavigator();
const AccountingStack = createNativeStackNavigator();
const ProductionStack = createNativeStackNavigator();

// References Stack Navigator
function ReferencesStackScreen() {
  return (
    <ReferencesStack.Navigator>
      <ReferencesStack.Screen name="ReferencesHome" component={ReferencesHomeScreen} options={{title: 'Справочники'}} />
      <ReferencesStack.Screen name="Units" component={UnitsScreen} options={{title: 'Единицы измерения'}} />
      <ReferencesStack.Screen name="UnitForm" component={UnitFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новая единица'})} />
      <ReferencesStack.Screen name="Currencies" component={CurrenciesScreen} options={{title: 'Валюты'}} />
      <ReferencesStack.Screen name="CurrencyForm" component={CurrencyFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новая валюта'})} />
      <ReferencesStack.Screen name="Warehouses" component={WarehousesScreen} options={{title: 'Склады'}} />
      <ReferencesStack.Screen name="WarehouseForm" component={WarehouseFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый склад'})} />
      <ReferencesStack.Screen name="CashRegisters" component={CashRegistersScreen} options={{title: 'Кассы'}} />
      <ReferencesStack.Screen name="CashRegisterForm" component={CashRegisterFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новая касса'})} />
      <ReferencesStack.Screen name="ProductTypes" component={ProductTypesScreen} options={{title: 'Типы товаров'}} />
      <ReferencesStack.Screen name="ProductTypeForm" component={ProductTypeFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый тип'})} />
      <ReferencesStack.Screen name="Products" component={ProductsScreen} options={{title: 'Товары'}} />
      <ReferencesStack.Screen name="ProductForm" component={ProductFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый товар'})} />
      <ReferencesStack.Screen name="CounterpartyTypes" component={CounterpartyTypesScreen} options={{title: 'Типы контрагентов'}} />
      <ReferencesStack.Screen name="CounterpartyTypeForm" component={CounterpartyTypeFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый тип'})} />
      <ReferencesStack.Screen name="Counterparties" component={CounterpartiesScreen} options={{title: 'Контрагенты'}} />
      <ReferencesStack.Screen name="CounterpartyForm" component={CounterpartyFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый контрагент'})} />
      <ReferencesStack.Screen name="Partners" component={PartnersScreen} options={{title: 'Компаньоны'}} />
      <ReferencesStack.Screen name="PartnerForm" component={PartnerFormScreen} options={({route}: any) => ({title: route.params?.id ? 'Редактирование' : 'Новый компаньон'})} />
    </ReferencesStack.Navigator>
  );
}

// Accounting Stack Navigator
function AccountingStackScreen() {
  return (
    <AccountingStack.Navigator>
      <AccountingStack.Screen name="AccountingHome" component={AccountingHomeScreen} options={{title: 'Бухгалтерия'}} />
      <AccountingStack.Screen name="TransactionsList" component={TransactionsListScreen} options={{title: 'Движения'}} />
      <AccountingStack.Screen name="CashBalance" component={CashBalanceScreen} options={{title: 'Касса'}} />
      <AccountingStack.Screen name="StockBalance" component={StockBalanceScreen} options={{title: 'Склад'}} />
      <AccountingStack.Screen name="CounterpartyBalance" component={CounterpartyBalanceScreen} options={{title: 'Контрагенты'}} />
      <AccountingStack.Screen name="DividendBalance" component={DividendBalanceScreen} options={{title: 'Дивиденды'}} />
      <AccountingStack.Screen name="SalaryBalance" component={SalaryBalanceScreen} options={{title: 'Зарплата'}} />
    </AccountingStack.Navigator>
  );
}

// Production Stack Navigator
function ProductionStackScreen() {
  return (
    <ProductionStack.Navigator>
      <ProductionStack.Screen name="ProductionHome" component={ProductionHomeScreen} options={{title: 'Производство'}} />
      <ProductionStack.Screen name="RecipesList" component={RecipesListScreen} options={{title: 'Рецепты'}} />
      <ProductionStack.Screen name="ProductionsList" component={ProductionsListScreen} options={{title: 'Производство'}} />
    </ProductionStack.Navigator>
  );
}

// Admin Stack Navigator
function AdminStackScreen() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen
        name="AdminHome"
        component={RolesScreen}
        options={{title: 'Администрирование'}}
      />
      <AdminStack.Screen
        name="Roles"
        component={RolesScreen}
        options={{title: 'Роли'}}
      />
      <AdminStack.Screen
        name="RoleForm"
        component={RoleFormScreen}
        options={({route}: any) => ({
          title: route.params?.id ? 'Редактирование роли' : 'Новая роль',
        })}
      />
      <AdminStack.Screen
        name="Users"
        component={UsersScreen}
        options={{title: 'Пользователи'}}
      />
      <AdminStack.Screen
        name="UserForm"
        component={UserFormScreen}
        options={({route}: any) => ({
          title: route.params?.id ? 'Редактирование пользователя' : 'Новый пользователь',
        })}
      />
    </AdminStack.Navigator>
  );
}

// Tab Icon Component
function TabIcon({name, focused}: {name: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Home: '🏠',
    References: '📋',
    Accounting: '💼',
    Production: '🏭',
    Admin: '⚙️',
    Profile: '👤',
  };
  return (
    <>{icons[name] || '📄'}</>
  );
}

// Main Tab Navigator
function MainTabs() {
  const {user, hasPermission} = useAuth();
  const hasAdminAccess = user?.role?.permissions?.some(
    (p: any) => p.module === 'admin',
  );
  const hasReferencesAccess = user?.role?.permissions?.some(
    (p: any) => p.module === 'references',
  );
  const hasAccountingAccess = user?.role?.permissions?.some(
    (p: any) => p.module === 'accounting',
  );
  const hasProductionAccess = user?.role?.permissions?.some(
    (p: any) => p.module === 'production',
  );

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {backgroundColor: '#FFFFFF'},
        headerTitleStyle: {fontWeight: '600'},
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Главная'}}
      />
      {hasReferencesAccess && (
        <Tab.Screen
          name="References"
          component={ReferencesStackScreen}
          options={{headerShown: false, title: 'Справочники'}}
        />
      )}
      {hasAccountingAccess && (
        <Tab.Screen
          name="Accounting"
          component={AccountingStackScreen}
          options={{headerShown: false, title: 'Бухгалтерия'}}
        />
      )}
      {hasProductionAccess && (
        <Tab.Screen
          name="Production"
          component={ProductionStackScreen}
          options={{headerShown: false, title: 'Производство'}}
        />
      )}
      {hasAdminAccess && (
        <Tab.Screen
          name="Admin"
          component={AdminStackScreen}
          options={{headerShown: false, title: 'Админ'}}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Профиль'}}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
