"use strict";

module.exports = {
  rules: {
    "require-test-id": require("./rules/require-test-id"),
  },
  configs: {
    recommended: {
      plugins: ["focusbear-testing"],
      rules: {
        "focusbear-testing/require-test-id": "error",
      },
    },
  },
};
