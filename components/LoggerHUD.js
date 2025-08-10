import React from "react";
import { View, Text } from "react-native";

export default function LoggerHUD({ lines = [] }) {
  return (
    <View style={{
      position:'absolute', left:8, top: 32, right:8,
      backgroundColor:'rgba(0,0,0,0.5)', borderRadius:8, padding:8, zIndex:9999
    }}>
      {lines.slice(-6).map((s, i) => (
        <Text key={i} style={{ color:'white', fontSize:12 }}>{s}</Text>
      ))}
    </View>
  );
}
