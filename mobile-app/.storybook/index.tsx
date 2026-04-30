import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { view } from "./storybook.requires";
import BootSplash from "react-native-bootsplash";

const StorybookUI = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

const StorybookUIRoot = () => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return <StorybookUI />;
};

export default StorybookUIRoot;
