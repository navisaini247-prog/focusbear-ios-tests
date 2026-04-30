import React from "react";
import { View } from "react-native";

export function Space({ width = 10, height = 10 }) {
  return <View style={{ width, height }} />;
}
