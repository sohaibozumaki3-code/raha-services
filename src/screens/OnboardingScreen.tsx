import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';
import { i18n } from '../i18n';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const OnboardingScreen = ({ navigation }: any) => {
  const { language, setLanguage } = useStore();
  const [step, setStep] = React.useState(1);

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={80} color={COLORS.primary} />
            <Text style={styles.title}>Raha Services</Text>
            <Text style={styles.subtitle}>{i18n.t('welcome')}</Text>
          </View>

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>{i18n.t('selectLanguage')}</Text>
            
            {(['ar', 'fr', 'en'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.optionCard, language === lang && styles.optionCardActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.optionText, language === lang && styles.optionTextActive]}>
                  {lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English'}
                </Text>
                {language === lang && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={() => setStep(2)}>
            <Text style={styles.buttonText}>{i18n.t('continue')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{i18n.t('roleSelection')}</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate('LoginChoice', { role: 'customer' })}>
            <View style={styles.roleIcon}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.roleTitle}>{i18n.t('customer')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate('LoginChoice', { role: 'driver' })}>
            <View style={styles.roleIcon}>
              <Ionicons name="bicycle" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.roleTitle}>{i18n.t('driver')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate('LoginChoice', { role: 'merchant' })}>
            <View style={styles.roleIcon}>
              <Ionicons name="storefront" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.roleTitle}>{i18n.t('merchant')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminCard} onPress={() => navigation.navigate('LoginChoice', { role: 'admin' })}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.textLight} />
            <Text style={styles.adminText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.secondary, marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  optionsContainer: { marginBottom: 48, gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  optionCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  optionTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  roleCard: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  roleIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  roleTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
  adminCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 16 },
  adminText: { color: COLORS.textLight, fontWeight: 'bold' }
});
