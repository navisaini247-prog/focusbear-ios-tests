// For SVG files transformed into React components by react-native-svg-transformer
declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.gif";
declare module "*.mp4";
declare module "*.lottie";
