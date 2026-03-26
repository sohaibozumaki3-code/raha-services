import React from "react";
import { View, Text, Button } from "react-native";

export const LoginScreen = ({ navigation }) => {

  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      
      <Text style={{fontSize:24}}>Login 🔐</Text>

      {/* Customer */}
      <Button 
        title="Login as Customer"
        onPress={() => navigation.replace("Main", { role: "customer" })}
      />

      {/* Admin */}
      <Button 
        title="Login as Admin"
        onPress={() => navigation.replace("Main", { role: "admin" })}
      />

    </View>
  );
};
