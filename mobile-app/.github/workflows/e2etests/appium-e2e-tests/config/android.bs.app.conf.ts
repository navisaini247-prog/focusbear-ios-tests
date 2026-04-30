const { config } = require('./wdio.shared.conf');

// ============
// Specs
// ============
config.specs = [
  '../tests/specs/*.spec.ts',
];
// =============================
// Browserstack specific config
// =============================
// User configuration
config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;
config.hostname = 'hub.browserstack.com';

// Use browserstack service
config.services = ['browserstack'];

// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
  {
    // Set your BrowserStack config
    'browserstack.debug': true,

    // Set URL of the application under test
    app:
      process.env.BROWSERSTACK_APP_ID,

    // Specify device and os_version for testing
    device: 'Google Pixel 5',
    os_version: '12.0',

    // Set other BrowserStack capabilities
    project: 'Focus Bear',
    build: 'android',
    name: 'FocusBear-Test',
  },
];

exports.config = config;
