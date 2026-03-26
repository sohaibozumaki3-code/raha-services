import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import { NotificationService } from '../../services/notifications';

const { width } = Dimensions.get('window');

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export const CustomerTrackingScreen = ({ navigation }: any) => {
  const { currentOrder, driverLocation, userLocation, setCurrentOrder, setDriverLocation, setUserLocation } = useStore();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [distance, setDistance] = useState<string>('0');
  const [eta, setEta] = useState<string>('0');
  
  const mapRef = useRef<MapView>(null);
  const markerAnim = useRef<any>(null);
  const prevStatusRef = useRef<string>('pending');

  // 1. Get initial customer location
  useEffect(() => {
    const getCustomerLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLoadingLocation(false);
      } catch (error) {
        setLoadingLocation(false);
      }
    };

    getCustomerLocation();
  }, [setUserLocation]);

  // 2. Listen to active order updates & Trigger Notifications
  useEffect(() => {
    if (!currentOrder?.id) return;

    const orderRef = doc(db, 'orders', currentOrder.id);
    const unsubscribeOrder = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as any;
        setCurrentOrder(orderData);
        
        // Trigger local notification on status change
        if (orderData.status !== prevStatusRef.current) {
          if (orderData.status === 'accepted') {
            NotificationService.sendLocalNotification('Driver Found! 🛵', 'A driver has accepted your order and is heading to the store.');
          } else if (orderData.status === 'on_the_way') {
            NotificationService.sendLocalNotification('Order on the way! 🚀', 'Your driver has picked up the order and is heading to you.');
          } else if (orderData.status === 'delivered') {
            NotificationService.sendLocalNotification('Order Delivered! 🎉', 'Enjoy your order! Thank you for using Raha Services.');
          }
          prevStatusRef.current = orderData.status;
        }
      }
    });

    return () => unsubscribeOrder();
  }, [currentOrder?.id, setCurrentOrder]);

  // 3. Listen to live driver location
  useEffect(() => {
    if (!currentOrder?.driverId) return;

    const driverRef = doc(db, 'drivers', currentOrder.driverId);
    const unsubscribeDriver = onSnapshot(driverRef, (docSnap) => {
      if (docSnap.exists()) {
        const driverData = docSnap.data();
        if (driverData.location) {
          setDriverLocation(driverData.location);
        }
      }
    });

    return () => unsubscribeDriver();
  }, [currentOrder?.driverId, setDriverLocation]);

  // 4. Handle Map Animations & ETA Calculation
  useEffect(() => {
    if (driverLocation) {
      if (!markerAnim.current) {
        markerAnim.current = new AnimatedRegion({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        markerAnim.current.timing({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          duration: 2000,
          useNativeDriver: false,
        }).start();
      }

      if (userLocation) {
        const distKm = getDistanceFromLatLonInKm(
          driverLocation.latitude, driverLocation.longitude,
          userLocation.latitude, userLocation.longitude
        );
        
        setDistance(distKm.toFixed(1));
        const estimatedMinutes = Math.max(1, Math.round(distKm / 0.5));
        setEta(estimatedMinutes.toString());

        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
              { latitude: userLocation.latitude, longitude: userLocation.longitude }
            ],
            {
              edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
              animated: true,
            }
          );
        }
      }
    }
  }, [driverLocation, userLocation]);

  if (!currentOrder || currentOrder.status === 'delivered') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name={currentOrder?.status === 'delivered' ? 'checkmark-circle' : 'map'} size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>
            {currentOrder?.status === 'delivered' ? 'Order Delivered Successfully!' : 'No active orders to track.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : undefined;

  const getStatusMessage = () => {
    switch (currentOrder.status) {
      case 'pending': return 'Finding a driver for you...';
      case 'accepted': return 'Driver is heading to the store.';
      case 'on_the_way': return 'Driver is heading to you!';
      default: return 'Processing your order...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {loadingLocation ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsCompass={false}
            showsMyLocationButton={false}
          >
            {userLocation && (
              <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.userMarkerContainer}>
                  <View style={styles.userMarkerInner} />
                </View>
              </Marker>
            )}

            {currentOrder.pickupLocation && currentOrder.status !== 'on_the_way' && (
              <Marker coordinate={{ latitude: currentOrder.pickupLocation.latitude, longitude: currentOrder.pickupLocation.longitude }}>
                <View style={styles.storeMarkerContainer}>
                  <Ionicons name="storefront" size={20} color={COLORS.surface} />
                </View>
              </Marker>
            )}

            {driverLocation && markerAnim.current && (
              <Marker.Animated
                coordinate={markerAnim.current}
                anchor={{ x: 0.5, y: 0.5 }}
                rotation={driverLocation.heading || 0}
                flat={true}
              >
                <View style={styles.driverMarkerContainer}>
                  <Ionicons name="car" size={24} color={COLORS.surface} />
                </View>
              </Marker.Animated>
            )}

            {driverLocation && userLocation && currentOrder.status === 'on_the_way' && (
              <Polyline
                coordinates={[
                  { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
                  { latitude: userLocation.latitude, longitude: userLocation.longitude }
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={4}
                lineDashPattern={[10, 10]}
              />
            )}
            
            {driverLocation && currentOrder.pickupLocation && currentOrder.status === 'accepted' && (
              <Polyline
                coordinates={[
                  { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
                  { latitude: currentOrder.pickupLocation.latitude, longitude: currentOrder.pickupLocation.longitude }
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={4}
                lineDashPattern={[10, 10]}
              />
            )}
          </MapView>
        )}

        {driverLocation && currentOrder.status === 'on_the_way' && (
          <View style={styles.floatingEtaCard}>
            <View style={styles.etaContent}>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.etaUnit}>min</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaContent}>
              <Text style={styles.distanceValue}>{distance}</Text>
              <Text style={styles.distanceUnit}>km</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Info Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderTitle}>Order #{currentOrder.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderSubtitle}>{getStatusMessage()}</Text>
          </View>
          {currentOrder.status === 'pending' ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <View style={styles.statusBadge}>
              <Text style={styles.statusTitle}>{currentOrder.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          )}
        </View>

        {currentOrder.driverId && (
          <>
            <View style={styles.divider} />
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={COLORS.textLight} />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>Your Driver</Text>
                <Text style={styles.driverCar}>Honda CG 125 • Black</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="call" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ChatRoom', { chatId: `order_${currentOrder.id}`, title: 'Driver', recipientId: currentOrder.driverId })}>
                  <Ionicons name="chatbubble" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { padding: 20, backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  mapContainer: { flex: 1, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  map: { width: width, height: '100%' },
  userMarkerContainer: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary },
  userMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  storeMarkerContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface },
  driverMarkerContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 2, borderColor: COLORS.surface },
  floatingEtaCard: { position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: COLORS.surface, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  etaContent: { alignItems: 'center', justifyContent: 'center' },
  etaValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary, lineHeight: 24 },
  etaUnit: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginTop: -2 },
  distanceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, lineHeight: 24 },
  distanceUnit: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginTop: -2 },
  etaDivider: { width: 1, height: 30, backgroundColor: COLORS.border, marginHorizontal: 20 },
  bottomSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
  orderSubtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  statusBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  driverCar: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyText: { fontSize: 18, color: COLORS.secondary, fontWeight: 'bold' }
});
