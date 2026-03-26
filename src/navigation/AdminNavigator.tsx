import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: any;
          if (route.name === 'Dashboard') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
};
