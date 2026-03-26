import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MerchantDashboardScreen, MerchantProductsScreen } from '../screens/merchant/MerchantScreens';
import { MerchantOrdersScreen } from '../screens/merchant/MerchantOrdersScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { CreatePostScreen } from '../screens/social/CreatePostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MerchantTabs = () => {
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
          else if (route.name === 'Products') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={MerchantDashboardScreen} />
      <Tab.Screen name="Products" component={MerchantProductsScreen} />
      <Tab.Screen name="Orders" component={MerchantOrdersScreen} />
      <Tab.Screen name="Social" component={SocialFeedScreen} options={{ tabBarLabel: 'Feed' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: i18n.t('chat') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: i18n.t('profile') }} />
    </Tab.Navigator>
  );
};

export const MerchantNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MerchantTabs} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};
