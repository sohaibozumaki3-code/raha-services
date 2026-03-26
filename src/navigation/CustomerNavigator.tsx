import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { SmartOrderScreen } from '../screens/SmartOrderScreen';
import { CustomerTrackingScreen } from '../screens/customer/CustomerTrackingScreen';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { PublicProfileScreen } from '../screens/social/PublicProfileScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CustomerTabs = () => (
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
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Order') iconName = focused ? 'flash' : 'flash-outline';
        else if (route.name === 'Track') iconName = focused ? 'map' : 'map-outline';
        else if (route.name === 'Social') iconName = focused ? 'planet' : 'planet-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={24} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: i18n.t('home') }} />
    <Tab.Screen name="Order" component={SmartOrderScreen} options={{ tabBarLabel: i18n.t('order') }} />
    <Tab.Screen name="Track" component={CustomerTrackingScreen} options={{ tabBarLabel: 'Track' }} />
    <Tab.Screen name="Social" component={SocialFeedScreen} options={{ tabBarLabel: 'Feed' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: i18n.t('profile') }} />
  </Tab.Navigator>
);

export const CustomerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CustomerTabs} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </Stack.Navigator>
  );
};
