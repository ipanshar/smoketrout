import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../lib/api';

interface Recipe {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  ingredients: { id: number; product: { name: string }; quantity: number }[];
  outputs: { id: number; product: { name: string }; quantity: number }[];
}

export default function RecipesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadRecipes = async () => {
    try {
      const response = await api.get('/production/recipes');
      setRecipes(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <View style={styles.item}>
      <TouchableOpacity onPress={() => toggleExpand(item.id)}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemCode}>{item.code}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          {!item.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Неактивен</Text>
            </View>
          )}
          <Text style={styles.expandIcon}>{expandedId === item.id ? '▲' : '▼'}</Text>
        </View>
        <Text style={styles.itemSubtitle}>
          {item.ingredients.length} ингр. → {item.outputs.length} выход
        </Text>
      </TouchableOpacity>

      {expandedId === item.id && (
        <View style={styles.expandedContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ингредиенты</Text>
            {item.ingredients.map((ing) => (
              <Text key={ing.id} style={styles.listItem}>
                • {ing.product.name}: {ing.quantity}
              </Text>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выход</Text>
            {item.outputs.map((out) => (
              <Text key={out.id} style={[styles.listItem, { color: '#22c55e' }]}>
                • {out.product.name}: {out.quantity}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет рецептов</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  inactiveBadge: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  inactiveBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  listItem: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    marginBottom: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
