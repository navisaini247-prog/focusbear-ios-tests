module.exports = {
  preset: "react-native",
  moduleDirectories: ["node_modules", "src"],
  globals: {
    __DEV__: true,
  },
  setupFiles: ["<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js", "<rootDir>/jest.setup.js"],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect", "<rootDir>/jest.setup.js"],
  transformIgnorePatterns: ["node_modules//", "jest-runner"],
  testPathIgnorePatterns: ["<rootDir>/.github/workflows/e2etests/appium-e2e-tests/tests/specs"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!<rootDir>/node_modules/", "!<rootDir>/path/to/dir/"],
};
