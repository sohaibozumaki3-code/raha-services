import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DriverOrdersScreen, DriverEarningsScreen } from '../screens/driver/DriverScreens';
import { DriverMapScreen } from '../screens/driver/DriverMapScreen';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { PublicProfileScreen } from '../screens/social/PublicProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DriverTabs = () => (
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
        if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
        else if (route.name === 'Social') iconName = focused ? 'planet' : 'planet-outline';
        else if (route.name === 'Chat') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={24} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Map" component={DriverMapScreen} />
    <Tab.Screen name="Orders" component={DriverOrdersScreen} />
    <Tab.Screen name="Social" component={SocialFeedScreen} options={{ tabBarLabel: 'Feed' }} />
    <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: i18n.t('chat') }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: i18n.t('profile') }} />
  </Tab.Navigator>
);

export const DriverNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={DriverTabs} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </Stack.Navigator>
  );
};
