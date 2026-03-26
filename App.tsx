import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import { LoginScreen } from "./src/screens/auth/LoginScreen";

// Navigators
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AdminNavigator } from "./src/navigation/AdminNavigator";

const Stack = createNativeStackNavigator();

function MainSwitcher({ route }) {
  const role = route.params?.role;

  // 🔥 اختيار الواجهة حسب الدور
  if (role === "admin") {
    return <AdminNavigator />;
  }

  // Default: customer
  return <AppNavigator />;
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        {/* 🔐 Login */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />

        {/* 🚀 Main App */}
        <Stack.Screen 
          name="Main" 
          component={MainSwitcher} 
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
