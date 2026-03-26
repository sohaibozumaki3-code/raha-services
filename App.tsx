import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import { LoginChoiceScreen } from "./src/screens/auth/LoginChoiceScreen";
import { LoginScreen } from "./src/screens/auth/LoginScreen";

// Navigators
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AdminNavigator } from "./src/navigation/AdminNavigator";

const Stack = createNativeStackNavigator();

function MainSwitcher({ route }) {
  const role = route.params?.role;

  if (role === "admin") {
    return <AdminNavigator />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen 
          name="Choice" 
          component={LoginChoiceScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />

        <Stack.Screen 
          name="Main" 
          component={MainSwitcher} 
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
