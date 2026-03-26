import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';
import { useStore } from '../store/useStore';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import * as Location from 'expo-location';
import { Logger } from '../utils/logger';

export const SmartOrderScreen = ({ navigation }: any) => {
  const { language, user, userLocation, setUserLocation, setCurrentOrder, updateWalletBalance } = useStore();
  const isRTL = language === 'ar';
  
  const [request, setRequest] = useState('');
  const [budget, setBudget] = useState('');
  const [isAutoSelect, setIsAutoSelect] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      try {
        if (!userLocation) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          } else {
            Logger.warn('Location permission denied by user.');
          }
        }
      } catch (error) {
        Logger.error('Failed to get location', error);
      }
    };
    getLocation();
  }, [userLocation, setUserLocation]);

  const validateOrder = () => {
    if (!request.trim()) {
      Alert.alert('Validation Error', 'Please describe what you need.');
      return false;
    }
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid budget amount.');
      return false;
    }
    if (!user?.uid) {
      Alert.alert('Authentication Error', 'You must be logged in to place an order.');
      return false;
    }

    const totalCost = parseFloat(budget) + 15; // 15 is standard delivery fee
    if (paymentMethod === 'wallet' && (user.walletBalance || 0) < totalCost) {
      Alert.alert('Insufficient Balance', `Your wallet balance is ${(user.walletBalance || 0).toFixed(2)} MAD, but the total cost is ${totalCost.toFixed(2)} MAD. Please top up or use Cash.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateOrder()) return;

    setIsSubmitting(true);
    Logger.info(`User ${user!.uid} is creating a new order.`);

    try {
      const deliveryCoords = userLocation || { latitude: 33.9267, longitude: -6.8898 };
      const pickupCoords = { latitude: deliveryCoords.latitude + 0.01, longitude: deliveryCoords.longitude + 0.01 }; 
      
      const totalAmount = parseFloat(budget);
      const deliveryFee = 15;
      const totalCost = totalAmount + deliveryFee;

      const orderData = {
        customerId: user!.uid,
        merchantId: isAutoSelect ? 'auto' : 'manual',
        status: 'pending',
        items: [{ description: request.trim() }],
        totalAmount: totalAmount,
        deliveryFee: deliveryFee,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deliveryLocation: deliveryCoords,
        pickupLocation: pickupCoords,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending'
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      Logger.info(`Order created successfully with ID: ${docRef.id}`);
      
      // Deduct from wallet if paid via wallet
      if (paymentMethod === 'wallet') {
        try {
          if (!user!.uid.startsWith('mock')) {
            await updateDoc(doc(db, 'users', user!.uid), { walletBalance: increment(-totalCost) });
          }
          updateWalletBalance(-totalCost);
          Logger.info(`Deducted ${totalCost} MAD from user wallet.`);
        } catch (e) {
          Logger.error("Failed to deduct wallet balance in Firestore", e);
          updateWalletBalance(-totalCost); // Fallback local update
        }
      }

      setCurrentOrder({ id: docRef.id, ...orderData } as any);
      
      setRequest('');
      setBudget('');
      
      navigation.navigate('Track');
    } catch (error) {
      Logger.error("Error creating order:", error);
      Alert.alert('Error', 'Failed to submit order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('smartOrderTitle')} 🤖</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('whatDoYouNeed')}</Text>
          <TextInput
            style={[styles.textArea, isRTL && { textAlign: 'right' }]}
            placeholder="E.g., 2 liters of milk, bread, and some fruits"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            value={request}
            onChangeText={setRequest}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('budget')} (MAD)</Text>
          <TextInput
            style={[styles.input, isRTL && { textAlign: 'right' }]}
            placeholder="Max limit (e.g., 150)"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>

        {/* Payment Method Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity 
              style={[styles.paymentCard, paymentMethod === 'cash' && styles.paymentCardActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Ionicons name="cash-outline" size={28} color={paymentMethod === 'cash' ? COLORS.primary : COLORS.textLight} />
              <Text style={[styles.paymentTitle, paymentMethod === 'cash' && styles.paymentTitleActive]}>Cash</Text>
              <Text style={styles.paymentDesc}>Pay on delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentCard, paymentMethod === 'wallet' && styles.paymentCardActive]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <Ionicons name="wallet-outline" size={28} color={paymentMethod === 'wallet' ? COLORS.primary : COLORS.textLight} />
              <Text style={[styles.paymentTitle, paymentMethod === 'wallet' && styles.paymentTitleActive]}>Wallet</Text>
              <Text style={styles.paymentDesc}>{(user?.walletBalance || 0).toFixed(2)} MAD</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.label}>Merchant Selection</Text>
          <TouchableOpacity 
            style={[styles.optionCard, isAutoSelect && styles.optionCardActive]}
            onPress={() => setIsAutoSelect(true)}
          >
            <Ionicons name="flash" size={24} color={isAutoSelect ? COLORS.primary : COLORS.textLight} />
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, isAutoSelect && styles.optionTitleActive]}>Auto-Select</Text>
              <Text style={styles.optionDesc}>System finds the best merchant nearby</Text>
            </View>
            {isAutoSelect && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee:</Text>
          <Text style={styles.summaryValue}>15.00 MAD</Text>
        </View>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.submitBtnText}>{i18n.t('submitOrder')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  content: { padding: 20, gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
  textArea: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, minHeight: 100, textAlignVertical: 'top' },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 16 },
  
  paymentMethodsContainer: { flexDirection: 'row', gap: 12 },
  paymentCard: { flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 8 },
  paymentCardActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  paymentTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  paymentTitleActive: { color: COLORS.primary },
  paymentDesc: { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },

  optionsContainer: { gap: 12 },
  optionCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 16 },
  optionCardActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  optionTitleActive: { color: COLORS.primary },
  optionDesc: { fontSize: 12, color: COLORS.textLight },
  
  footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 16, color: COLORS.textLight },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});
