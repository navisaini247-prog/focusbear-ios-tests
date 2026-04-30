const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const {
  resolver: { sourceExts, assetExts },
} = defaultConfig;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: [...assetExts.filter((ext) => ext !== "svg"), "lottie"],
    sourceExts: [...sourceExts, "svg"],
    resolverMainFields: ["sbmodern", "react-native", "browser", "main"],
    resolveRequest: (context, moduleName, platform) => {
      const defaultResolveResult = context.resolveRequest(context, moduleName, platform);

      if (
        process.env.STORYBOOK_ENABLED === "true" &&
        defaultResolveResult.filePath &&
        defaultResolveResult.filePath.endsWith("src/App.js")
      ) {
        return {
          filePath: path.resolve(__dirname, "./.storybook/index.tsx"),
          type: "sourceFile",
        };
      }

      return defaultResolveResult;
    },
  },
};

const mergedConfig = mergeConfig(defaultConfig, config);

// Wrap with Storybook configuration only when Storybook is enabled.
// This avoids loading the Storybook metro module (and its ESM dependencies) during normal builds.
// Set enabled: false to disable Storybook in production builds
const isStorybookEnabled = process.env.STORYBOOK_ENABLED === "true";
module.exports = isStorybookEnabled
  ? require("@storybook/react-native/metro/withStorybook").withStorybook(mergedConfig, {
      enabled: true,
      configPath: path.resolve(__dirname, ".storybook"),
    })
  : mergedConfig;
