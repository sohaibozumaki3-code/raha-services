import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AdminNavigator } from "./src/navigation/AdminNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  const userRole = "admin"; // 🔥 مؤقتاً

  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen name="Login" component={LoginScreen} />

        {userRole === "admin" ? (
          <Stack.Screen 
            name="Main" 
            component={AdminNavigator} 
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={AppNavigator} 
            options={{ headerShown: false }}
          />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
