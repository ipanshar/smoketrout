import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';

export default function HomeScreen() {
  const {user} = useAuth();

  const stats = [
    {name: 'Пользователей', value: '—', color: '#3B82F6', emoji: '👥'},
    {name: 'Ролей', value: '—', color: '#8B5CF6', emoji: '🛡️'},
    {name: 'Контрагентов', value: '—', color: '#10B981', emoji: '💼'},
    {name: 'Рецептов', value: '—', color: '#F59E0B', emoji: '📋'},
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Добро пожаловать, {user?.name}! 👋
        </Text>
        <Text style={styles.subtext}>Вот краткий обзор вашей системы</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, {backgroundColor: stat.color + '20'}]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statName}>{stat.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📦 Создать партию производства</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📋 Добавить рецепт</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>👤 Добавить контрагента</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 15,
    color: '#374151',
  },
});
