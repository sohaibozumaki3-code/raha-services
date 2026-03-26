import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const MOCK_USERS = [
  { id: '1', name: 'Youssef Alaoui', role: 'customer', status: 'active', phone: '+212600112233' },
  { id: '2', name: 'Ahmed Driver', role: 'driver', status: 'pending', phone: '+212600445566' },
  { id: '3', name: 'Marjane Temara', role: 'merchant', status: 'active', phone: '+212600778899' },
  { id: '4', name: 'Karim (Blocked)', role: 'driver', status: 'blocked', phone: '+212600000000' },
];

export const AdminUsersScreen = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'pending': return '#F59E0B';
      case 'blocked': return COLORS.error;
      default: return COLORS.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsContainer}>
          {['all', 'customer', 'driver', 'merchant'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, filter === tab && styles.activeTab]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.textLight} />
              </View>
              <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userPhone}>{item.phone}</Text>
              </View>
            </View>

            <View style={styles.userMeta}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            </View>

            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.actionBtnApprove}>
                  <Text style={styles.actionTextApprove}>Approve</Text>
                </TouchableOpacity>
              )}
              {item.status === 'active' ? (
                <TouchableOpacity style={styles.actionBtnBlock}>
                  <Text style={styles.actionTextBlock}>Block</Text>
                </TouchableOpacity>
              ) : item.status === 'blocked' ? (
                <TouchableOpacity style={styles.actionBtnApprove}>
                  <Text style={styles.actionTextApprove}>Unblock</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  filtersContainer: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.text, outlineStyle: 'none' },
  tabsContainer: { flexDirection: 'row', gap: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  activeTab: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tabText: { color: COLORS.textLight, fontWeight: '600' },
  activeTabText: { color: COLORS.surface },
  listContainer: { padding: 20, gap: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 4 },
  userPhone: { fontSize: 14, color: COLORS.textLight },
  userMeta: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  roleBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  roleText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  actions: { flex: 1, alignItems: 'flex-end' },
  actionBtnApprove: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionTextApprove: { color: COLORS.surface, fontWeight: 'bold' },
  actionBtnBlock: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  actionTextBlock: { color: COLORS.error, fontWeight: 'bold' }
});
