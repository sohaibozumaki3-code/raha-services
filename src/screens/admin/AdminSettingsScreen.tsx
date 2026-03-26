import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export const AdminSettingsScreen = () => {
  const { logout } = useStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Rates</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Fee Commission (%)</Text>
            <TextInput style={styles.input} value="10" keyboardType="numeric" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant Sales Commission (%)</Text>
            <TextInput style={styles.input} value="5" keyboardType="numeric" />
          </View>

          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout Admin</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  content: { padding: 20 },
  section: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: COLORS.textLight, marginBottom: 8 },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 }
});
