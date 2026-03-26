import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';
import { useStore } from '../store/useStore';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';

export const HomeScreen = ({ navigation }: any) => {
  const { language, user, activeOffers, setFeedPosts } = useStore();
  const isRTL = language === 'ar';
  const [search, setSearch] = useState('');

  const services = [
    { title: "Food", icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png" },
    { title: "Pharmacy", icon: "https://cdn-icons-png.flaticon.com/512/483/483361.png" },
    { title: "Market", icon: "https://cdn-icons-png.flaticon.com/512/263/263142.png" },
    { title: "Delivery", icon: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png" }
  ];

  // Fetch AI Suggestions / Offers
  useEffect(() => {
    const q = query(collection(db, 'posts'), where('isOffer', '==', true), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const offersData: any[] = [];
      snapshot.forEach((doc) => offersData.push({ id: doc.id, ...doc.data() }));
      setFeedPosts(offersData); 
    });
    return () => unsubscribe();
  }, [setFeedPosts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 🔝 Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Raha Services 🚀</Text>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.surface} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>
            {i18n.t('welcome')}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! What do you need today?
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              placeholder="Search for anything..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
            />
          </View>
        </View>

        {/* ⚡ Quick Actions */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>

          <View style={styles.servicesGrid}>
            {services.map((item, index) => (
              <TouchableOpacity key={index} style={styles.serviceItem}>
                <View style={styles.serviceIconWrapper}>
                  <Image
                    source={{ uri: item.icon }}
                    style={styles.serviceIcon}
                  />
                </View>
                <Text style={styles.serviceTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🔥 Smart Order Action */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => navigation.navigate("Order")}
          >
            <View style={styles.mainActionContent}>
              <View>
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={12} color={COLORS.surface} />
                  <Text style={styles.aiBadgeText}>AI Powered</Text>
                </View>
                <Text style={styles.mainActionTitle}>Smart Order</Text>
                <Text style={styles.mainActionDesc}>Type what you need, set a budget.</Text>
              </View>
              <View style={styles.mainActionIcon}>
                <Ionicons name="flash" size={32} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 📦 Track */}
        <View style={styles.trackSection}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate("Track")}
          >
            <Ionicons name="location" size={20} color={COLORS.secondary} />
            <Text style={styles.trackBtnText}>Track Your Active Order</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Live Offers Integration */}
        {activeOffers.length > 0 && (
          <View style={styles.offersSection}>
            <View style={styles.offersHeader}>
              <Text style={styles.sectionTitle}>Flash Offers 🔥</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Social')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersScroll}>
              {activeOffers.map((item) => (
                <View key={item.id} style={styles.offerCard}>
                  <View style={styles.offerCardHeader}>
                    <Text style={styles.offerAuthor} numberOfLines={1}>{item.authorName}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
                    </View>
                  </View>
                  <Text style={styles.offerContent} numberOfLines={2}>{item.content}</Text>
                  <TouchableOpacity style={styles.claimBtn}>
                    <Text style={styles.claimBtnText}>Claim Offer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.secondary },
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: { padding: 24, backgroundColor: COLORS.secondary, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: COLORS.surface, fontSize: 26, fontWeight: "bold", letterSpacing: 0.5 },
  notificationBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  badge: { position: 'absolute', top: 6, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  headerSubtitle: { color: "#ccc", marginTop: 8, fontSize: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#222", marginTop: 20, paddingHorizontal: 16, borderRadius: 16, height: 56 },
  searchInput: { flex: 1, marginLeft: 12, color: COLORS.surface, fontSize: 16, outlineStyle: 'none' },

  // Services
  servicesSection: { padding: 24, paddingTop: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.secondary, marginBottom: 20 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 },
  serviceItem: { width: "25%", alignItems: "center", marginBottom: 20, paddingHorizontal: 8 },
  serviceIconWrapper: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 8 },
  serviceIcon: { width: 32, height: 32 },
  serviceTitle: { fontSize: 13, color: COLORS.text, fontWeight: '500', textAlign: 'center' },

  // Main Action
  actionSection: { paddingHorizontal: 24, paddingBottom: 16 },
  mainActionBtn: { backgroundColor: COLORS.secondary, borderRadius: 24, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  mainActionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  aiBadgeText: { color: COLORS.surface, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  mainActionTitle: { color: COLORS.surface, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  mainActionDesc: { color: COLORS.textLight, fontSize: 14 },
  mainActionIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)' },

  // Track
  trackSection: { paddingHorizontal: 24, paddingBottom: 24 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', padding: 16, borderRadius: 16, gap: 12 },
  trackBtnText: { color: COLORS.secondary, fontSize: 16, fontWeight: '600' },

  // Offers
  offersSection: { paddingBottom: 40 },
  offersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  seeAllText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  offersScroll: { paddingHorizontal: 24, gap: 16 },
  offerCard: { width: 280, backgroundColor: '#FFFBEB', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#FDE68A', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  offerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  offerAuthor: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#92400E', marginRight: 8 },
  discountBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  discountText: { color: COLORS.surface, fontSize: 12, fontWeight: 'bold' },
  offerContent: { fontSize: 15, color: '#B45309', marginBottom: 20, lineHeight: 22 },
  claimBtn: { backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  claimBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 15 },
});
