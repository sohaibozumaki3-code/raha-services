import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, Dimensions } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

// Throttling configuration
const FIRESTORE_UPDATE_INTERVAL = 5000; // 5 seconds

export const DriverMapScreen = () => {
  const { isOnline, toggleOnlineStatus, location, setLocation, user } = useStore();
  const [mapRegion, setMapRegion] = useState<any>(null);
  const mapRef = useRef<MapView>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      if (!isOnline || !user?.uid) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        toggleOnlineStatus(); // Turn off if permission denied
        return;
      }

      // Get initial location immediately
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const initialCoords = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        heading: initialLocation.coords.heading || 0,
      };
      
      setLocation(initialCoords);
      setMapRegion({
        ...initialCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Start watching position continuously
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Local updates every 2 seconds for smooth UI
          distanceInterval: 2, // Or every 2 meters
        },
        async (loc) => {
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading || 0,
          };
          
          // 1. Update Local State (Smooth 60fps local viewing)
          setLocation(newLocation);
          
          // Auto-center map locally
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: { latitude: newLocation.latitude, longitude: newLocation.longitude },
              heading: newLocation.heading,
              pitch: 45, // 3D-like navigation view
              zoom: 18
            }, { duration: 1000 });
          }

          // 2. Throttle Firestore Updates (Save writes and battery)
          const now = Date.now();
          if (now - lastUpdateRef.current > FIRESTORE_UPDATE_INTERVAL) {
            lastUpdateRef.current = now;
            try {
              const driverRef = doc(db, 'drivers', user.uid);
              await updateDoc(driverRef, {
                location: newLocation,
                lastUpdated: now,
                isOnline: true
              });
            } catch (error) {
              console.error("Error updating location in Firestore:", error);
            }
          }
        }
      );
    };

    const stopTracking = async () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (user?.uid) {
        try {
          const driverRef = doc(db, 'drivers', user.uid);
          await updateDoc(driverRef, { isOnline: false });
        } catch (error) {
          console.error("Error setting offline status:", error);
        }
      }
    };

    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isOnline, user?.uid, setLocation, toggleOnlineStatus]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {location && mapRegion ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            pitchEnabled={true}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              rotation={location.heading || 0}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
            >
              <View style={styles.driverMarkerContainer}>
                <Ionicons name="navigate" size={28} color={COLORS.surface} style={{ transform: [{ rotate: '-45deg' }] }} />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.offlinePlaceholder}>
            <View style={styles.offlineIconContainer}>
              <Ionicons name="car-sport" size={60} color={COLORS.textLight} />
            </View>
            <Text style={styles.mapText}>You are currently offline</Text>
            <Text style={styles.mapSubtext}>Go online to start tracking your location and receiving delivery requests.</Text>
          </View>
        )}
      </View>

      <View style={styles.onlineToggleContainer}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textLight }]} />
          <View>
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Text style={styles.statusSubtext}>{isOnline ? 'Finding delivery requests...' : 'Not receiving orders'}</Text>
          </View>
        </View>
        <Switch
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={isOnline ? COLORS.primary : COLORS.surface}
          onValueChange={toggleOnlineStatus}
          value={isOnline}
          style={styles.switch}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  map: { width: width, height: '100%' },
  offlinePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  offlineIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  mapText: { fontSize: 24, color: COLORS.secondary, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  mapSubtext: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', lineHeight: 24 },
  driverMarkerContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 3, borderColor: COLORS.surface },
  onlineToggleContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: COLORS.secondary, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 15 },
  statusInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusText: { fontSize: 20, fontWeight: 'bold', color: COLORS.surface, marginBottom: 4 },
  statusSubtext: { fontSize: 14, color: COLORS.textLight },
  switch: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }
});
