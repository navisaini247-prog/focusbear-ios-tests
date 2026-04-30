import { join } from 'path';
const { config } = require('./wdio.shared.conf');

// ============
// Specs
// ============
config.specs = [
  '../tests/specs/*.spec.ts',
];

// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
  {
    // The defaults you need to have in your config
    platformName: 'Android',
    maxInstances: 1,
    'appium:deviceName': 'Pixel_5_API_31', // device name
    'appium:platformVersion': '12',
    'appium:orientation': 'PORTRAIT',
    // `automationName` will be mandatory, see
    'appium:automationName': 'uiautomator2',
    // The path to the app
    'appium:app': join(
      process.cwd(),
      './apps/app-development-release.apk',
    ),
    'appium:noReset': false,
    // 'appium:fullReset': true,
    acceptInsecureCerts: true,
    'appium:appWaitActivity': 'com.focusbear.MainActivity',
    'appium:newCommandTimeout': 240,
    timeouts: { implicit: 60000, pageLoad: 60000, script: 60000 },
  },
];

exports.config = config;
