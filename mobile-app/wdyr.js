import React from "react";
import Config from "react-native-config";

if (process.env.NODE_ENV === "development" && Config.DEBUG_RENDER === "True") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
