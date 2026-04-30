exports.config = {
    // ====================
    // Runner and framework
    // Configuration
    // ====================
    runner: 'local',
    autoCompileOpts: {
      autoCompile: true,
      // see https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
      // for all available options
      tsNodeOpts: {
        transpileOnly: true,
        project: 'tsconfig.json',
      },
      // tsconfig-paths is only used if "tsConfigPathsOpts" are provided, if you
      // do please make sure "tsconfig-paths" is installed as dependency
      //tsConfigPathsOpts: {
      //    baseUrl: './'
      //}
    },
    framework: 'jasmine',
    jasmineOpts: {
      defaultTimeoutInterval: 24 * 60 * 60 * 1000,
    },
    sync: true,
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 120000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    reporters: [ 'spec'],
  
    // ====================
    // Appium Configuration
    // ====================
    services: [
      [
        'appium',
        {
          command: 'appium',
          // args: {
          //   debugLogSpacing: true,
          //   sessionOverride: true,
          //   port: 4723,
          //   allowInsecure: 'chromedriver_autodownload',
          // },
        },
      ],
    ],
    path: '/wd/hub',
  };
  