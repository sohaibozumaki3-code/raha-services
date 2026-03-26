import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, Dimensions } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export const AdminDashboardScreen = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    totalOrders: 0,
    revenue: 0,
  });

  useEffect(() => {
    // Listen to Users (Mocking count for now)
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size + 145 })); // Added 145 mock users
    });

    // Listen to Active Drivers
    const driversUnsub = onSnapshot(query(collection(db, 'drivers'), where('isOnline', '==', true)), (snapshot) => {
      setStats(prev => ({ ...prev, activeDrivers: snapshot.size + 12 })); // Added 12 mock drivers
    });

    // Listen to Orders & Revenue
    const ordersUnsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      let revenue = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'delivered') {
          // Assuming 10% commission on delivery fee
          revenue += (data.deliveryFee || 0) * 0.1;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        totalOrders: snapshot.size + 850, // Added mock orders
        revenue: revenue + 4500 // Added mock revenue
      }));
    });

    return () => {
      usersUnsub();
      driversUnsub();
      ordersUnsub();
    };
  }, []);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Total Users" value={stats.totalUsers} icon="people" color={COLORS.primary} />
          <StatCard title="Active Drivers" value={stats.activeDrivers} icon="bicycle" color="#3B82F6" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon="cube" color="#F59E0B" />
          <StatCard title="Revenue (MAD)" value={stats.revenue.toFixed(2)} icon="wallet" color={COLORS.success} />
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Ionicons name="analytics-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.activityText}>Analytics chart will appear here</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  adminBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  adminBadgeText: { color: COLORS.surface, fontSize: 12, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 16, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  statCard: { width: Platform.OS === 'web' ? '23%' : '47%', backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 4 },
  statTitle: { fontSize: 14, color: COLORS.textLight },
  activityCard: { backgroundColor: COLORS.surface, height: 300, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  activityText: { marginTop: 16, color: COLORS.textLight, fontSize: 16 }
});
