import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/theme';

const Placeholder = ({ title }: { title: string }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
    </View>
  </SafeAreaView>
);

export const DriverOrdersScreen = () => <Placeholder title="Driver Orders" />;
export const DriverMapScreen = () => <Placeholder title="Driver Map" />;
export const DriverEarningsScreen = () => <Placeholder title="Driver Earnings" />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary }
});
