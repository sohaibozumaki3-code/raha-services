import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useStore } from '../../store/useStore';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const MerchantOrdersScreen = () => {
  const { user, activeOrders, setActiveOrders } = useStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Real-time listener for merchant's active orders
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('merchantId', '==', user.uid),
      where('status', 'in', ['pending', 'accepted', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: any[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setActiveOrders(ordersData);
    }, (error) => {
      console.error("Error listening to merchant orders:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, setActiveOrders]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return COLORS.error;
      case 'accepted': return COLORS.primary;
      case 'preparing': return '#F59E0B'; // Amber
      case 'ready': return COLORS.success;
      default: return COLORS.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Orders</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeOrders.length}</Text>
        </View>
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>No active orders right now</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.orderContent}>
              <Text style={styles.itemCount}>{item.items?.length || 0} Items</Text>
              <Text style={styles.totalAmount}>{item.totalAmount} MAD</Text>
            </View>

            {item.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btn, styles.btnReject]}>
                  <Text style={styles.btnTextReject}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnAccept]}>
                  <Text style={styles.btnTextAccept}>Accept Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginRight: 12 },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },
  listContainer: { padding: 16, gap: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textLight },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  itemCount: { fontSize: 14, color: COLORS.textLight },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  actionButtons: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  btnAccept: { backgroundColor: COLORS.primary },
  btnTextReject: { color: COLORS.error, fontWeight: 'bold' },
  btnTextAccept: { color: COLORS.surface, fontWeight: 'bold' }
});
