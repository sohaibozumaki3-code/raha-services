import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { Logger } from '../../utils/logger';
import { NotificationService } from '../../services/notifications';

export const DriverOrdersScreen = () => {
  const { user, activeOrders, setActiveOrders, isOnline } = useStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !isOnline) {
      setActiveOrders([]);
      return;
    }

    Logger.info(`Driver ${user.uid} is online. Listening for orders...`);

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('status', 'in', ['pending', 'accepted', 'on_the_way'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: any[] = [];
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        
        // Notify driver of NEW pending orders
        if (change.type === 'added' && data.status === 'pending') {
          NotificationService.sendLocalNotification(
            'New Delivery Request! 🛵',
            `A new order for ${data.totalAmount} MAD is available nearby.`
          );
        }
      });

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'pending' || data.driverId === user.uid) {
          ordersData.push({ id: docSnap.id, ...data });
        }
      });
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setActiveOrders(ordersData);
    }, (error) => {
      Logger.error("Error listening to orders:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, isOnline, setActiveOrders]);

  const acceptOrder = async (orderId: string) => {
    if (!user?.uid) return;
    setProcessingId(orderId);
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("Order does not exist!");
        if (orderDoc.data().status !== 'pending') throw new Error("Order is no longer available.");
        
        transaction.update(orderRef, {
          driverId: user.uid,
          status: 'accepted',
          updatedAt: Date.now()
        });
      });
      Logger.info(`Driver ${user.uid} accepted order ${orderId}`);
      
      // Simulate sending push to customer
      NotificationService.sendLocalNotification(
        'Order Accepted ✅',
        'You have successfully accepted the delivery.'
      );

    } catch (error: any) {
      Logger.error("Error accepting order:", error);
      Alert.alert('Action Failed', error.message || 'Could not accept order.');
    } finally {
      setProcessingId(null);
    }
  };

  const startDelivery = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'on_the_way', updatedAt: Date.now() });
      
      NotificationService.sendLocalNotification(
        'Delivery Started 🚀',
        'Drive safely to the customer location.'
      );
    } catch (error) {
      Logger.error("Error starting delivery:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const completeOrder = async (orderId: string, paymentMethod: string, totalAmount: number, deliveryFee: number) => {
    setProcessingId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'delivered', 
        paymentStatus: 'paid',
        updatedAt: Date.now() 
      });
      
      const message = paymentMethod === 'cash' 
        ? `You should have collected ${totalAmount + deliveryFee} MAD in cash.`
        : `Order delivered. Payment was already settled via Wallet.`;
        
      Alert.alert('Delivery Completed!', message);
      
      NotificationService.sendLocalNotification(
        'Great Job! 🎉',
        `You completed the delivery and earned ${deliveryFee} MAD.`
      );

    } catch (error) {
      Logger.error("Error completing order:", error);
      Alert.alert('Error', 'Failed to complete order.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Requests</Text>
        </View>
        <View style={styles.offlineState}>
          <Ionicons name="power" size={80} color={COLORS.textLight} />
          <Text style={styles.offlineText}>Go online in the Map tab to see orders</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Requests</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeOrders.length}</Text>
        </View>
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 20 }} />
            <Text style={styles.emptyText}>Finding delivery requests...</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
              <View style={[styles.statusBadge, item.status === 'pending' ? styles.statusPending : styles.statusActive]}>
                <Text style={[styles.statusText, item.status === 'pending' ? styles.statusTextPending : styles.statusTextActive]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="cart-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.locationText}>{item.items[0]?.description || 'Custom Order'}</Text>
              </View>
              
              {/* Payment Info Box */}
              <View style={[styles.paymentBox, item.paymentMethod === 'cash' ? styles.paymentCash : styles.paymentWallet]}>
                <Ionicons name={item.paymentMethod === 'cash' ? 'cash' : 'wallet'} size={24} color={item.paymentMethod === 'cash' ? '#B45309' : '#047857'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentMethodText, { color: item.paymentMethod === 'cash' ? '#B45309' : '#047857' }]}>
                    {item.paymentMethod === 'cash' ? 'CASH ON DELIVERY' : 'PAID VIA WALLET'}
                  </Text>
                  <Text style={[styles.paymentAmount, { color: item.paymentMethod === 'cash' ? '#92400E' : '#065F46' }]}>
                    {item.paymentMethod === 'cash' ? `Collect ${item.totalAmount + item.deliveryFee} MAD` : 'Do not collect cash'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionContainer}>
              {item.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.acceptBtn, processingId === item.id && { opacity: 0.7 }]} 
                  onPress={() => acceptOrder(item.id)}
                  disabled={processingId === item.id}
                >
                  {processingId === item.id ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.acceptBtnText}>Accept Delivery</Text>}
                </TouchableOpacity>
              )}

              {item.status === 'accepted' && item.driverId === user?.uid && (
                <TouchableOpacity 
                  style={[styles.startBtn, processingId === item.id && { opacity: 0.7 }]} 
                  onPress={() => startDelivery(item.id)}
                  disabled={processingId === item.id}
                >
                  {processingId === item.id ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.startBtnText}>Pick Up & Start Delivery</Text>}
                </TouchableOpacity>
              )}

              {item.status === 'on_the_way' && item.driverId === user?.uid && (
                <View style={styles.onTheWayContainer}>
                  <View style={styles.assignedBadge}>
                    <Ionicons name="bicycle" size={20} color={COLORS.primary} />
                    <Text style={styles.assignedText}>You are delivering this</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.completeBtn, processingId === item.id && { opacity: 0.7 }]} 
                    onPress={() => completeOrder(item.id, item.paymentMethod, item.totalAmount, item.deliveryFee)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.completeBtnText}>Mark Delivered</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },
  listContainer: { padding: 16, gap: 16 },
  orderCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  statusTextPending: { color: '#D97706' },
  statusTextActive: { color: '#059669' },
  orderDetails: { marginBottom: 20, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 14, color: COLORS.textLight, flex: 1 },
  
  paymentBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1 },
  paymentCash: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  paymentWallet: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  paymentMethodText: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  paymentAmount: { fontSize: 16, fontWeight: 'bold' },

  actionContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  acceptBtn: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  startBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  onTheWayContainer: { gap: 12 },
  assignedBadge: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  assignedText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  completeBtn: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center' },
  completeBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: COLORS.textLight, fontWeight: 'bold' },
  offlineState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  offlineText: { marginTop: 20, fontSize: 18, color: COLORS.textLight, fontWeight: 'bold', textAlign: 'center' }
});
