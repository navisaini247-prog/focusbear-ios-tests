import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";

export const theme = {
  light: {
    ...DefaultTheme,
    webContentTheme: "LIGHT",
    isDarkTheme: false,
    colors: {
      ...DefaultTheme.colors,
      text: COLOR.BLACK,
      subText: COLOR.GRAY[500],
      background: COLOR.GRAY[50],
      card: COLOR.WHITE,
      border: COLOR.GRAY[400],
      separator: COLOR.GRAY[200],
      primary: COLOR.AMBER[500],
      primaryBorder: COLOR.AMBER[600],
      secondary: COLOR.GRAY[100],
      secondaryBorder: COLOR.GRAY[300],
      transparent: COLOR.TRANSPARENT,
      overlay: COLOR.LIGHT_OVERLAY,
      black: COLOR.BLACK,
      white: COLOR.WHITE,

      danger: COLOR.RED[600],
      dangerBg: COLOR.RED[50],
      success: COLOR.GREEN[600],
      successBg: COLOR.GREEN[50],
      warning: COLOR.YELLOW[600],
      warningBg: COLOR.YELLOW[50],

      cyan: COLOR.CYAN[400],
      cyanBg: COLOR.CYAN[200],
      blue: COLOR.BLUE[400],
      blueBg: COLOR.BLUE[200],
      violet: COLOR.VIOLET[400],
      violetBg: COLOR.VIOLET[200],
      pink: COLOR.PINK[400],
      pinkBg: COLOR.PINK[200],
    },
    shadowStyles: {
      shadow: {
        boxShadow: [{ color: COLOR.SHADOW, blurRadius: 8, offsetX: 0, offsetY: 6, spreadDistance: -6 }],
      },
      bigShadow: {
        boxShadow: [{ color: COLOR.SHADOW, blurRadius: 16, offsetX: 0, offsetY: 6, spreadDistance: -3 }],
      },
    },
  },
  dark: {
    ...DarkTheme,
    webContentTheme: "DARK",
    isDarkTheme: true,
    colors: {
      ...DarkTheme.colors,
      text: COLOR.WHITE,
      subText: COLOR.GRAY[400],
      background: COLOR.GRAY[950],
      card: COLOR.GRAY[900],
      border: COLOR.GRAY[500],
      separator: COLOR.GRAY[800],
      primary: COLOR.AMBER[500],
      primaryBorder: COLOR.AMBER[400],
      secondary: COLOR.GRAY[800],
      secondaryBorder: COLOR.GRAY[700],
      transparent: COLOR.TRANSPARENT,
      overlay: COLOR.DARK_OVERLAY,
      black: COLOR.BLACK,
      white: COLOR.WHITE,

      danger: COLOR.RED[400],
      dangerBg: COLOR.RED[950],
      success: COLOR.GREEN[400],
      successBg: COLOR.GREEN[950],
      warning: COLOR.YELLOW[400],
      warningBg: COLOR.YELLOW[950],

      cyan: COLOR.CYAN[700],
      cyanBg: COLOR.CYAN[950],
      blue: COLOR.BLUE[700],
      blueBg: COLOR.BLUE[950],
      violet: COLOR.VIOLET[700],
      violetBg: COLOR.VIOLET[950],
      pink: COLOR.PINK[700],
      pinkBg: COLOR.PINK[950],
    },
    shadowStyles: {
      shadow: {
        boxShadow: [{ color: COLOR.DARKER_SHADOW, blurRadius: 8, offsetX: 0, offsetY: 6, spreadDistance: -6 }],
      },
      bigShadow: {
        boxShadow: [{ color: COLOR.DARKER_SHADOW, blurRadius: 16, offsetX: 0, offsetY: 6, spreadDistance: -3 }],
      },
    },
  },
};
