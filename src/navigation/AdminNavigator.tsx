import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";

const Tab = createBottomTabNavigator();

function AdminDashboard() {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text>Admin Dashboard 🧠</Text>
    </View>
  );
}

function UsersScreen() {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text>Manage Users 👥</Text>
    </View>
  );
}

function OrdersScreen() {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text>All Orders 📦</Text>
    </View>
  );
}

export function AdminNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
}
