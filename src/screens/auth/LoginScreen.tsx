import React from "react";
import { View, Text, Button } from "react-native";

export const LoginScreen = ({ route, navigation }) => {

  const role = route.params?.role;

  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>

      <Text style={{fontSize:24}}>Login 🔐</Text>
      <Text>Role: {role}</Text>

      <Button 
        title="Enter App"
        onPress={() => navigation.replace("Main", { role })}
      />

    </View>
  );
};
