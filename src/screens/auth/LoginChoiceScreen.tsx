import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const LoginChoiceScreen = ({ route, navigation }: any) => {
  const { role } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={role === 'driver' ? 'bicycle' : role === 'merchant' ? 'storefront' : role === 'admin' ? 'shield-checkmark' : 'person'} 
            size={80} 
            color={COLORS.primary} 
          />
        </View>
        <Text style={styles.title}>Welcome {role}</Text>
        <Text style={styles.subtitle}>Please login to your account or create a new one to continue.</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login', { role })}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>

          {role !== 'admin' && (
            <TouchableOpacity 
              style={styles.signupBtn}
              onPress={() => navigation.navigate('SignUp', { role })}
            >
              <Text style={styles.signupBtnText}>Create New Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 8, textTransform: 'capitalize' },
  subtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 48, paddingHorizontal: 20 },
  buttonsContainer: { width: '100%', gap: 16 },
  loginBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  signupBtn: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  signupBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' }
});
