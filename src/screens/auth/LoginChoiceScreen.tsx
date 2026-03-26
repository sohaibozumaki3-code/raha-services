import React from "react";
import { View, Text, Button } from "react-native";

export const LoginChoiceScreen = ({ navigation }) => {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>

      <Text style={{fontSize:24}}>Choose Role 👇</Text>

      <Button 
        title="Customer"
        onPress={() => navigation.navigate("Login", { role: "customer" })}
      />

      <Button 
        title="Admin"
        onPress={() => navigation.navigate("Login", { role: "admin" })}
      />

    </View>
  );
};
