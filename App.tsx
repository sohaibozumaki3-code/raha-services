import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { LoginScreen } from "./src/screens/auth/LoginScreen";

const Stack = createNativeStackNavigator();

function ErrorFallback() {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text>Something went wrong ⚠️</Text>
    </View>
  );
}

export default function App() {
  try {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} initialParams={{ role: 'customer' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    return <ErrorFallback />;
  }
}
